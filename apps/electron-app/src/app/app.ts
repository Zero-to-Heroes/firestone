// Import Angular compiler FIRST to enable JIT compilation fallback for decorated services
import '@angular/compiler';
import { ElectronGameWindowService } from '@firestone/electron/common';
// Expose to global for services that need runtime access without bundler issues
(global as any).ElectronGameWindowService = ElectronGameWindowService;
// import '@overwolf/types';
import { AllCardsService } from '@firestone-hs/reference-data';
import { GameEvents } from '@firestone/game-state';
import { DiskCacheService, LogListenerService, SubscriptionService } from '@firestone/shared/common/service';
import {
	AppInjector,
	CardsFacadeStandaloneService,
	DATABASE_SERVICE_TOKEN,
	WINDOW_HANDLER_SERVICE_TOKEN,
} from '@firestone/shared/framework/core';
import { BrowserWindow, app as electronApp, globalShortcut, ipcMain, shell } from 'electron';
import { appendFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { appendFile } from 'fs/promises';
import { join } from 'path';
import { distinctUntilChanged, Subscription } from 'rxjs';
import { uIOhook } from 'uiohook-napi';
import { environment } from '../environments/environment';
import { appStartup } from './app-startup';
import { formatLogArg } from './format-log-arg';
import { appAccessUnlocked$$, disposeAppAccessPolicy, initAppAccessPolicy } from './services/app-access-policy';
import { maybeShowConsentOnStartup } from './services/cmp';
import { ComputeWorkerHost } from './services/compute-worker-host';
import { buildAppInjector } from './services/electron-app-injector-setup';
import { registerElectronDiskCacheIpcHandlers } from './services/electron-disk-cache-ipc';
import { ElectronDiskCacheService } from './services/electron-disk-cache.service';
import { ElectronHotkeyHandlerService } from './services/electron-hotkey-handler.service';
import { ElectronWindowHandlerService } from './services/electron-window-handler.service';
import { startFakeGameDriver } from './services/fake-game-driver';
import { startMemoryInstrumentation, stopMemoryInstrumentation } from './services/memory-instrumentation.service';
import { MindVisionElectronService } from './services/mind-vision-electron.service';
import { registerOpenExternalLinksForAllBrowserWindows } from './services/open-external-links-window-hook';
import { OverlayService } from './services/overlay.service';
import { showPremiumLockNotificationOnce } from './services/premium-lock-notification';
import { installRemoteImageGate } from './services/remote-image-gate';
import { runBlankWindowMemoryProbe } from './services/blank-window-memory-probe';
import { destroySystemTray, initSystemTray } from './services/system-tray';

// Auth callback data interface
export interface AuthCallbackData {
	token: string;
	userName: string;
	displayName: string;
	avatar: string;
	isPremium: boolean;
	provider: string;
	internalUserName: string;
	/** Used for ow-electron ads hashed-email identity; not shown in UI */
	email?: string;
}

export interface TwitchCallbackData {
	accessToken: string;
	scope?: string;
	tokenType?: string;
}

export default class App {
	static application: Electron.App;
	static overlay: OverlayService;
	static gameWindow: ElectronGameWindowService;
	static flushRendererLogs: (() => Promise<void>) | null = null;
	static rendererLogFlushTimer: NodeJS.Timeout | null = null;
	/** Unsubscribed in onWillQuit. */
	private static appAccessWindowCloseSub: Subscription | null = null;

	// Auth callback listeners
	private static authCallbackListeners: ((data: AuthCallbackData) => void)[] = [];
	private static twitchCallbackListeners: ((data: TwitchCallbackData) => void)[] = [];
	/** Auth deep link received before initSystemTray registers listeners (cold start). */
	private static pendingAuthCallback: AuthCallbackData | null = null;
	private static pendingTwitchCallback: TwitchCallbackData | null = null;

	/**
	 * Register a listener for auth callbacks from deep links
	 */
	public static onAuthCallback(listener: (data: AuthCallbackData) => void): () => void {
		App.authCallbackListeners.push(listener);
		if (App.pendingAuthCallback) {
			const pending = App.pendingAuthCallback;
			App.pendingAuthCallback = null;
			try {
				listener(pending);
			} catch (err) {
				console.error('[Auth] Error in auth callback listener (pending):', err);
			}
		}
		// Return unsubscribe function
		return () => {
			const index = App.authCallbackListeners.indexOf(listener);
			if (index > -1) {
				App.authCallbackListeners.splice(index, 1);
			}
		};
	}

	/**
	 * Register a listener for Twitch OAuth callbacks from deep links
	 */
	public static onTwitchCallback(listener: (data: TwitchCallbackData) => void): () => void {
		App.twitchCallbackListeners.push(listener);
		if (App.pendingTwitchCallback) {
			const pending = App.pendingTwitchCallback;
			App.pendingTwitchCallback = null;
			try {
				listener(pending);
			} catch (err) {
				console.error('[Twitch] Error in Twitch callback listener (pending):', err);
			}
		}
		return () => {
			const index = App.twitchCallbackListeners.indexOf(listener);
			if (index > -1) {
				App.twitchCallbackListeners.splice(index, 1);
			}
		};
	}

	/**
	 * Parse and handle deep link URL (auth, twitch, or replay)
	 */
	private static handleDeepLink(url: string): void {
		console.log('[DeepLink] Received:', url);

		try {
			const urlObj = new URL(url);
			if (urlObj.protocol !== 'firestoneapp:') {
				console.log('[DeepLink] Not a firestone protocol, ignoring');
				return;
			}

			// Handle replay links: firestoneapp://replay/in-game?reviewId=X
			if (urlObj.hostname === 'replay' && urlObj.pathname === '/in-game') {
				console.warn('[DeepLink] IN-GAME REPLAY NOT SUPPORTED YET');
				const reviewId = urlObj.searchParams.get('reviewId');
				if (reviewId) {
					console.log('[DeepLink] Replay link, opening in browser:', reviewId);
					shell.openExternal(`https://replays.firestoneapp.com/?reviewId=${reviewId}`);
				}
				return;
			}

			// Handle Twitch OAuth callback: firestoneapp://twitch/#access_token=...
			if (urlObj.hostname === 'twitch') {
				App.handleTwitchDeepLink(url);
				return;
			}

			// Handle auth callback
			if (urlObj.hostname !== 'auth') {
				console.log('[DeepLink] Not auth, twitch, or replay, ignoring');
				return;
			}

			App.handleAuthDeepLink(url);
		} catch (err) {
			console.error('[DeepLink] Failed to parse URL:', err);
		}
	}

	/**
	 * Parse and handle auth callback from deep link URL
	 */
	private static handleAuthDeepLink(url: string): void {
		console.log('[Auth] Received auth deep link');

		try {
			const urlObj = new URL(url);

			const params = urlObj.searchParams;
			const authData: AuthCallbackData = {
				token: params.get('token') || '',
				userName: params.get('userName') || '',
				displayName: params.get('displayName') || '',
				avatar: params.get('avatar') || '',
				isPremium: params.get('isPremium') === 'true',
				provider: params.get('provider') || 'overwolf',
				// UserId in case of Overwolf, used to get the Tebex info
				internalUserName: params.get('internalUserName') || '',
				email: params.get('email') || '',
			};

			if (!authData.token) {
				console.error('[Auth] No token in auth callback');
				return;
			}

			console.log('[Auth] Parsed auth data for user:', authData.userName);

			App.dispatchAuthCallback(authData);
		} catch (err) {
			console.error('[Auth] Failed to parse deep link URL:', err);
		}
	}

	/**
	 * Parse and handle Twitch OAuth callback from deep link URL
	 */
	private static handleTwitchDeepLink(url: string): void {
		console.log('[Twitch] Received Twitch OAuth deep link');

		try {
			const urlObj = new URL(url);
			const params = new URLSearchParams(urlObj.hash.startsWith('#') ? urlObj.hash.substring(1) : urlObj.hash);
			const accessToken = params.get('access_token');

			if (!accessToken) {
				console.error('[Twitch] No access_token in Twitch callback');
				return;
			}

			const twitchData: TwitchCallbackData = {
				accessToken,
				scope: params.get('scope') || undefined,
				tokenType: params.get('token_type') || undefined,
			};

			console.log('[Twitch] Parsed Twitch OAuth callback');

			App.dispatchTwitchCallback(twitchData);
		} catch (err) {
			console.error('[Twitch] Failed to parse deep link URL:', err);
		}
	}

	private static dispatchAuthCallback(authData: AuthCallbackData): void {
		if (App.authCallbackListeners.length === 0) {
			console.log('[Auth] No listeners yet; queuing auth callback for user:', authData.userName);
			App.pendingAuthCallback = authData;
			return;
		}
		App.authCallbackListeners.forEach((listener) => {
			try {
				listener(authData);
			} catch (err) {
				console.error('[Auth] Error in auth callback listener:', err);
			}
		});
	}

	private static dispatchTwitchCallback(twitchData: TwitchCallbackData): void {
		if (App.twitchCallbackListeners.length === 0) {
			console.log('[Twitch] No listeners yet; queuing Twitch callback');
			App.pendingTwitchCallback = twitchData;
			return;
		}
		App.twitchCallbackListeners.forEach((listener) => {
			try {
				listener(twitchData);
			} catch (err) {
				console.error('[Twitch] Error in Twitch callback listener:', err);
			}
		});
	}

	/** App root folder — must match how ow-electron launches the app (directory, not main.js). */
	private static resolveAppRootForProtocolRegistration(): string | null {
		const path = require('path');
		if (process.argv.length < 2) {
			return null;
		}
		const argvPath = path.resolve(process.argv[1]);
		if (existsSync(path.join(argvPath, 'package.json'))) {
			return argvPath;
		}
		const parent = path.dirname(argvPath);
		if (existsSync(path.join(parent, 'package.json'))) {
			return parent;
		}
		return argvPath;
	}

	public static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
		// Store original console methods
		const originalLog = console.log.bind(console);
		const originalWarn = console.warn.bind(console);
		const originalError = console.error.bind(console);
		const originalDebug = console.debug.bind(console);

		// Setup file logging
		const logsDir = join(electronApp.getPath('userData'), 'logs');
		if (!existsSync(logsDir)) {
			mkdirSync(logsDir, { recursive: true });
		}

		// Create log file with date and timestamp for each app restart
		const now = new Date();
		const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
		const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
		const logFilePath = join(logsDir, `main-${date}-${time}.log`);

		// Clean up old log files (keep only the last 10 files)
		try {
			const files = readdirSync(logsDir)
				.filter((file) => (file.startsWith('main-') || file.startsWith('renderer-')) && file.endsWith('.log'))
				.map((file) => ({
					name: file,
					path: join(logsDir, file),
					mtime: statSync(join(logsDir, file)).mtimeMs,
				}))
				.sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first

			// Keep only the last 10 files, delete the rest
			if (files.length > 10) {
				for (let i = 10; i < files.length; i++) {
					unlinkSync(files[i].path);
				}
			}
		} catch (e) {
			// Ignore cleanup errors
		}

		// Helper function to write to log file
		const writeToLogFile = (level: string, ...args: any[]) => {
			try {
				const message = args.map((arg) => formatLogArg(arg)).join(' ');
				appendFileSync(logFilePath, `${message}\n`);
			} catch (e) {
				// Ignore file write errors
			}
		};

		// Helper function to format timestamp
		const getTimestamp = () => {
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const day = String(now.getDate()).padStart(2, '0');
			const hours = String(now.getHours()).padStart(2, '0');
			const minutes = String(now.getMinutes()).padStart(2, '0');
			const seconds = String(now.getSeconds()).padStart(2, '0');
			const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
			return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
		};

		// Override console.log to add timestamp and write to file
		console.log = (...args: any[]) => {
			const timestamp = getTimestamp();
			originalLog(`[${timestamp}]`, ...args.map((arg) => formatLogArg(arg)));
			writeToLogFile('INFO', `[${timestamp}] [INFO]`, ...args);
		};

		// Override console.warn to add timestamp and write to file
		console.warn = (...args: any[]) => {
			const timestamp = getTimestamp();
			originalWarn(`[${timestamp}]`, ...args.map((arg) => formatLogArg(arg)));
			writeToLogFile('WARN', `[${timestamp}] [WARN]`, ...args);
		};

		// Override console.error to add timestamp and write to file
		console.error = (...args: any[]) => {
			const timestamp = getTimestamp();
			originalError(`[${timestamp}]`, ...args.map((arg) => formatLogArg(arg)));
			writeToLogFile('ERROR', `[${timestamp}] [ERROR]`, ...args);
		};

		// Override console.debug to add timestamp (disabled by default but written to file)
		console.debug = (...args: any[]) => {
			const timestamp = getTimestamp();
			// originalDebug(`[${timestamp}]`, ...args);  // Uncomment to enable console debug
			// writeToLogFile('DEBUG', `[${timestamp}] [DEBUG]`, ...args);
		};

		// Log startup info
		console.log('='.repeat(80));
		console.log('Firestone Standalone starting...');
		console.log(`Log file: ${logFilePath}`);
		console.log(`App version: ${electronApp.getVersion()}`);
		console.log(`Electron version: ${process.versions.electron}`);
		console.log(`Chrome version: ${process.versions.chrome}`);
		console.log(`Node version: ${process.versions.node}`);
		console.log(`Platform: ${process.platform} ${process.arch}`);
		console.log(`Is packaged: ${electronApp.isPackaged}`);
		console.log(`Is development mode: ${App.isDevelopmentMode()}`);
		console.log('='.repeat(80));

		// we pass the Electron.App object and the
		// Electron.BrowserWindow into this function
		// so this class has no dependencies. This
		// makes the code easier to write tests for

		// App.BrowserWindow = browserWindow;
		App.application = app;
		// Plain <a href="https://..."> / target="_blank" → default browser (main process), no renderer changes
		registerOpenExternalLinksForAllBrowserWindows(app);
		// app.disableHardwareAcceleration();

		// Register firestoneapp:// protocol for deep linking (SSO auth callbacks)
		// Clear legacy firestone:// registration from older builds, then current scheme
		app.removeAsDefaultProtocolClient('firestone');
		app.removeAsDefaultProtocolClient('firestoneapp');

		let protocolRegistered = false;
		if (process.defaultApp) {
			// Development: register with the same app-folder arg ow-electron uses (not main.js).
			const appRoot = App.resolveAppRootForProtocolRegistration();
			if (appRoot) {
				console.log('[Auth] Registering protocol with execPath:', process.execPath, 'appRoot:', appRoot);
				protocolRegistered = app.setAsDefaultProtocolClient('firestoneapp', process.execPath, [appRoot]);
			}
		} else {
			protocolRegistered = app.setAsDefaultProtocolClient('firestoneapp');
		}
		if (protocolRegistered) {
			console.log('[Auth] Registered firestoneapp:// protocol handler');
		} else {
			console.warn(
				'[Auth] Could not register firestoneapp:// as default protocol handler (another app may own it). ' +
					'Login still works if the user clicks "Open Firestone" on the auth-callback page.',
			);
		}

		// Handle deep link when app is already running (Windows/Linux)
		// Make this instance the single instance
		const gotTheLock = app.requestSingleInstanceLock();
		if (!gotTheLock) {
			console.log('[Auth] Another instance is already running; exiting this one (deep link forwarded).');
			app.quit();
			return;
		}
		console.log('[Auth] Acquired single-instance lock');

		app.on('second-instance', (event, commandLine) => {
			console.log('[Auth] second-instance event, commandLine:', commandLine);

			const deepLinkUrl = commandLine.find((arg) => arg.startsWith('firestoneapp://'));
			if (deepLinkUrl) {
				App.handleDeepLink(deepLinkUrl);
			}
		});

		// Handle deep link when app is launched via protocol (macOS)
		app.on('open-url', (event, url) => {
			event.preventDefault();
			console.log('[Auth] open-url event:', url);
			App.handleDeepLink(url);
		});

		// Check if app was launched with a deep link URL (Windows - cold start)
		const deepLinkArg = process.argv.find((arg) => arg.startsWith('firestoneapp://'));
		if (deepLinkArg) {
			// Delay handling until app is ready
			app.whenReady().then(() => {
				console.log('[Auth] App launched with deep link:', deepLinkArg);
				App.handleDeepLink(deepLinkArg);
			});
		}

		// Set up IPC handler for renderer to request login
		ipcMain.handle('auth-login', async () => {
			const loginUrl = 'https://www.firestoneapp.com/login.html';
			// const loginUrl = 'https://localhost:4200/login.html';
			console.log('[Auth] Opening login page:', loginUrl);
			await shell.openExternal(loginUrl);
			return true;
		});

		// Set up IPC handler for renderer process logging with batching
		// Create a shared renderer log file (one per app session)
		const rendererLogNow = new Date();
		const rendererLogDate = rendererLogNow.toISOString().split('T')[0]; // YYYY-MM-DD
		const rendererLogTime = rendererLogNow.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
		const rendererLogFilePath = join(logsDir, `renderer-${rendererLogDate}-${rendererLogTime}.log`);

		// Batch renderer logs to reduce file I/O
		const rendererLogQueue: string[] = [];
		const RENDERER_LOG_BATCH_SIZE = 10; // Flush after 10 logs
		const RENDERER_LOG_FLUSH_INTERVAL = 1000; // Or flush every 1 second

		const flushRendererLogs = async () => {
			if (rendererLogQueue.length === 0) {
				return;
			}

			const logsToWrite = rendererLogQueue.splice(0); // Clear queue
			try {
				await appendFile(rendererLogFilePath, logsToWrite.join(''));
			} catch (e) {
				// Ignore file write errors
			}

			if (App.rendererLogFlushTimer) {
				clearTimeout(App.rendererLogFlushTimer);
				App.rendererLogFlushTimer = null;
			}
		};

		// Handle batched logs from renderer
		ipcMain.on('renderer-log-batch', async (event, logs: Array<{ level: string; args: any[] }>) => {
			try {
				for (const { level, args } of logs) {
					const message = args.map((arg) => formatLogArg(arg)).join(' ');
					const timestamp = getTimestamp();
					const logMessage = `[${timestamp}] [${level.toUpperCase()}] [RENDERER] ${message}\n`;

					// Add to queue
					rendererLogQueue.push(logMessage);

					// Also log to console with prefix (synchronous, but console is fast)
					originalLog(`[RENDERER] [${level.toUpperCase()}]`, ...args.map((arg) => formatLogArg(arg)));
				}

				// Flush if batch size reached
				if (rendererLogQueue.length >= RENDERER_LOG_BATCH_SIZE) {
					await flushRendererLogs();
				} else if (!App.rendererLogFlushTimer) {
					// Schedule flush after interval
					App.rendererLogFlushTimer = setTimeout(flushRendererLogs, RENDERER_LOG_FLUSH_INTERVAL);
				}
			} catch (e) {
				// Ignore errors
			}
		});

		// Keep single log handler for backwards compatibility (if needed)
		ipcMain.on('renderer-log', (event, level: string, ...args: any[]) => {
			// Convert to batch format and process
			ipcMain.emit('renderer-log-batch', event, [{ level, args }]);
		});

		// Allow overlay windows (e.g. Settings overlay) to initiate drag via mousedown
		// ow-electron requires startDragging() to be called from main process; CSS -webkit-app-region does not work
		ipcMain.on('start-overlay-dragging', (event) => {
			const overlayApi = App.overlay?.overlayApi;
			const overlayWindow = overlayApi?.fromWebContents(event.sender);
			if (overlayWindow && typeof (overlayWindow as any).startDragging === 'function') {
				(overlayWindow as any).startDragging();
			}
		});

		// Shared-texture hit-test workaround: renderer flips passthrough while hovering widgets.
		// https://dev.overwolf.com/ow-electron/reference/examples/overlay/shared-texture-rendering/#beta-limitation-hit-testing-ignores-transparent-pixels
		ipcMain.handle('overlay-shared-texture-hit-test-workaround', () => {
			return App.overlay?.isSharedTextureHitTestWorkaroundActive() ?? false;
		});
		ipcMain.on(
			'set-overlay-passthrough',
			(_event, mode: 'noPassThrough' | 'passThrough' | 'passThroughAndNotify') => {
				if (mode !== 'noPassThrough' && mode !== 'passThrough' && mode !== 'passThroughAndNotify') {
					return;
				}
				App.overlay?.setOverlayPassthrough(mode);
			},
		);

		// Close the current window (Settings overlay or regular BrowserWindow)
		ipcMain.on('close-settings-window', (event) => {
			const win = BrowserWindow.fromWebContents(event.sender);
			if (win && !win.isDestroyed()) {
				win.close();
			}
		});

		// Open URL in default browser (called from renderer process)
		ipcMain.handle('open-url-in-default-browser', async (_event, url: string) => {
			await shell.openExternal(url);
		});

		// Store flush function for cleanup on quit
		App.flushRendererLogs = flushRendererLogs;

		App.application.on('window-all-closed', App.onWindowAllClosed); // Quit when all windows are closed.
		App.application.on('ready', App.onReady); // App is ready to load data
		App.application.on('activate', App.onActivate); // App is activated
		App.application.on('will-quit', App.onWillQuit); // Clean up before quitting
	}

	public static isDevelopmentMode() {
		// If app is packaged (installed via installer), it's definitely production
		if (electronApp.isPackaged) {
			return false;
		}

		// Check environment variable if set
		const isEnvironmentSet: boolean = 'ELECTRON_IS_DEV' in process.env;
		if (isEnvironmentSet) {
			return parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;
		}

		// Fall back to environment.production flag
		return !environment.production;
	}

	private static async onWindowAllClosed() {
		// Not sure about this in fact, let's
		return;
		// App is tray-only (no main window). Keep running so user can open Settings again from tray.
		// Only quit when user chooses "Exit" from the tray menu.
		// if (App.overlay) {
		// 	console.log('onWindowAllClosed: destroying overlay');
		// 	await App.overlay.destroyOverlay();
		// }
	}

	private static async onWillQuit() {
		await stopMemoryInstrumentation();
		App.appAccessWindowCloseSub?.unsubscribe();
		App.appAccessWindowCloseSub = null;
		disposeAppAccessPolicy();
		destroySystemTray();

		// Unregister all global hotkeys and stop uiohook (Tab hold)
		globalShortcut.unregisterAll();
		uIOhook.stop();

		// Flush any remaining renderer logs
		if (App.rendererLogFlushTimer) {
			clearTimeout(App.rendererLogFlushTimer);
			App.rendererLogFlushTimer = null;
		}
		if (App.flushRendererLogs) {
			await App.flushRendererLogs();
		}
	}

	private static onClose() {
		// Nothing yet
	}

	private static onRedirect(event: any, url: string) {
		// Nothing yet
	}

	private static async onReady() {
		// This method will be called when Electron has finished
		// initialization and is ready to create browser windows.
		// Some APIs can only be used after this event occurs.

		if (process.platform === 'win32') {
			electronApp.setAppUserModelId('com.zerotoheroes.firestone.standalone');
		}

		// Before any BrowserWindow loads: optional image block for memory A/B (Phase 0c).
		installRemoteImageGate();
		await runBlankWindowMemoryProbe();

		// Free (ad-supported) build only: inform the user about / collect consent via the built-in CMP.
		await maybeShowConsentOnStartup();

		// Initialize game detection
		await App.initGameDetection();
		try {
			const subscription = AppInjector.get(SubscriptionService);
			await subscription.fetchCurrentPlan();
		} catch (e) {
			console.error('[app] fetchCurrentPlan before premium notification failed', e);
		}
		showPremiumLockNotificationOnce();
		initSystemTray();
	}

	private static async initGameDetection() {
		// Initialize dependency injection system
		const electronInjector = buildAppInjector();

		// Plan A memory/stall instrumentation (no-op unless FS_ELECTRON_MEM=1)
		startMemoryInstrumentation(electronInjector);

		const diskCache = electronInjector.get(DiskCacheService) as any as ElectronDiskCacheService;
		await diskCache.init();
		registerElectronDiskCacheIpcHandlers(diskCache);
		console.log('[app] diskCache initialized');

		// Initialize MindVision service for memory reading
		const mindVision = electronInjector.get(MindVisionElectronService);
		const allCards = electronInjector.get(CardsFacadeStandaloneService);
		const gameEvents = electronInjector.get(GameEvents);
		const logListener = electronInjector.get(LogListenerService);
		const powerLog = logListener
			.configure(
				'Power.log',
				(data) => gameEvents.receiveLogLine(data),
				(existingLine) => gameEvents.receiveExistingLogLine(existingLine),
			)
			.subscribe((status) => {
				console.log('[log-register] status for Power.log', status);
			})
			.start();
		await allCards.init(new AllCardsService(), 'enUS');
		console.log('[app] allCards initialized', allCards.getCards()?.length ?? 'null');

		// Spawn the persistent compute worker (BGS sims + end-of-game upload prep) now,
		// so the one-time cards clone happens while nothing is latency-sensitive
		electronInjector.get(ComputeWorkerHost).prewarm();

		// Unattended replay of a recorded Power.log through the real pipeline
		// (no-op unless FS_FAKE_GAME_LOG is set)
		startFakeGameDriver(electronInjector);

		const db = electronInjector.get(DATABASE_SERVICE_TOKEN);
		await db.init();

		// Initialize game services
		App.gameWindow = ElectronGameWindowService.getInstance();
		App.overlay = OverlayService.getInstance();
		App.gameWindow.initialize(App.overlay);

		// Wait for overlay to be ready before registering to games
		App.overlay.on('ready', async () => {
			console.log('🎯 Overlay service is ready!');

			// Register to monitor Hearthstone
			await App.overlay.registerToHearthstone();

			// Register global hotkeys (Alt+C, Alt+B, Tab)
			const hotkeyHandler = electronInjector.get(ElectronHotkeyHandlerService);
			await hotkeyHandler.init();

			// Don't create overlay window yet - wait for game launch event
			console.log('⏳ Waiting for Hearthstone to launch...');
		});

		// Keep the old game detection for logging purposes
		// App.gameDetection.on('game-launched', (gameInfo) => {
		// 	console.log('🎮 Process detection - Game launched:', gameInfo.displayName);
		// });

		// App.gameDetection.on('game-closed', (gameInfo) => {
		// 	console.log('👋 Process detection - Game closed:', gameInfo.displayName);
		// });

		// // Start monitoring (both process detection and ow-electron overlay)
		// App.gameDetection.startMonitoring();

		await initAppAccessPolicy();
		const windowHandler = electronInjector.get(WINDOW_HANDLER_SERVICE_TOKEN) as ElectronWindowHandlerService;
		App.appAccessWindowCloseSub = appAccessUnlocked$$.pipe(distinctUntilChanged()).subscribe((unlocked) => {
			if (!unlocked) {
				windowHandler.closeAllWindowsForAppAccess();
			}
		});

		await appStartup();
	}

	private static onActivate() {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		// Skip for overlay-only mode
		console.log('🚫 App activation - skipping main window recreation (overlay-only mode)');
		// if (App.mainWindow === null) {
		// 	App.onReady();
		// }
	}
}
