// Import Angular compiler FIRST to enable JIT compilation fallback for decorated services
import '@angular/compiler';
import { ElectronGameWindowService } from '@firestone/electron/common';
// Expose to global for services that need runtime access without bundler issues
(global as any).ElectronGameWindowService = ElectronGameWindowService;
// import '@overwolf/types';
import { AllCardsService } from '@firestone-hs/reference-data';
import { GameEvents } from '@firestone/game-state';
import { DiskCacheService, LogListenerService } from '@firestone/shared/common/service';
import { CardsFacadeStandaloneService, DATABASE_SERVICE_TOKEN, setAppInjector } from '@firestone/shared/framework/core';
import { BrowserWindow, app as electronApp, ipcMain, screen, shell } from 'electron';
import { appendFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { appendFile } from 'fs/promises';
import { join } from 'path';
import { format } from 'url';
import { environment } from '../environments/environment';
import { rendererAppName, rendererAppPort } from './constants';
import { electronAppInjector } from './services/electron-app-injector';
import { buildAppInjector } from './services/electron-app-injector-setup';
import { ElectronDiskCacheService } from './services/electron-disk-cache.service';
import { MindVisionElectronService } from './services/mind-vision-electron.service';
import { OverlayService } from './services/overlay.service';
import { destroySystemTray, initSystemTray } from './services/system-tray';

// Auth callback data interface
export interface AuthCallbackData {
	token: string;
	userName: string;
	displayName: string;
	avatar: string;
	isPremium: boolean;
	provider: string;
}

export default class App {
	// Keep a global reference of the window object, if you don't, the window will
	// be closed automatically when the JavaScript object is garbage collected.
	static mainWindow: Electron.BrowserWindow;
	static application: Electron.App;
	static BrowserWindow;
	static overlay: OverlayService;
	static gameWindow: ElectronGameWindowService;
	static flushRendererLogs: (() => Promise<void>) | null = null;
	static rendererLogFlushTimer: NodeJS.Timeout | null = null;

	// Auth callback listeners
	private static authCallbackListeners: ((data: AuthCallbackData) => void)[] = [];

	/**
	 * Register a listener for auth callbacks from deep links
	 */
	public static onAuthCallback(listener: (data: AuthCallbackData) => void): () => void {
		App.authCallbackListeners.push(listener);
		// Return unsubscribe function
		return () => {
			const index = App.authCallbackListeners.indexOf(listener);
			if (index > -1) {
				App.authCallbackListeners.splice(index, 1);
			}
		};
	}

	/**
	 * Parse and handle auth callback from deep link URL
	 */
	private static handleAuthDeepLink(url: string): void {
		console.log('[Auth] Received deep link:', url);

		try {
			const urlObj = new URL(url);

			// Check if this is an auth callback
			if (urlObj.protocol !== 'firestone:' || urlObj.hostname !== 'auth') {
				console.log('[Auth] Not an auth deep link, ignoring');
				return;
			}

			const params = urlObj.searchParams;
			const authData: AuthCallbackData = {
				token: params.get('token') || '',
				userName: params.get('userName') || '',
				displayName: params.get('displayName') || '',
				avatar: params.get('avatar') || '',
				isPremium: params.get('isPremium') === 'true',
				provider: params.get('provider') || 'overwolf',
			};

			if (!authData.token) {
				console.error('[Auth] No token in auth callback');
				return;
			}

			console.log('[Auth] Parsed auth data for user:', authData.userName);

			// Notify all listeners
			App.authCallbackListeners.forEach((listener) => {
				try {
					listener(authData);
				} catch (err) {
					console.error('[Auth] Error in auth callback listener:', err);
				}
			});

			// Auth data will be persisted to disk by the listener
			// StandaloneUserService will read it on next startup or can be notified via App.onAuthCallback
		} catch (err) {
			console.error('[Auth] Failed to parse deep link URL:', err);
		}
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
				.filter(file => (file.startsWith('main-') || file.startsWith('renderer-')) && file.endsWith('.log'))
				.map(file => ({
					name: file,
					path: join(logsDir, file),
					mtime: statSync(join(logsDir, file)).mtimeMs
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
				const message = args.map(arg =>
					typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
				).join(' ');
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
			originalLog(`[${timestamp}]`, ...args);
			writeToLogFile('INFO', `[${timestamp}] [INFO]`, ...args);
		};

		// Override console.warn to add timestamp and write to file
		console.warn = (...args: any[]) => {
			const timestamp = getTimestamp();
			originalWarn(`[${timestamp}]`, ...args);
			writeToLogFile('WARN', `[${timestamp}] [WARN]`, ...args);
		};

		// Override console.error to add timestamp and write to file
		console.error = (...args: any[]) => {
			const timestamp = getTimestamp();
			originalError(`[${timestamp}]`, ...args);
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
		console.log('Firestone Desktop starting...');
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

		App.BrowserWindow = browserWindow;
		App.application = app;
		// app.disableHardwareAcceleration();

		// Register firestone:// protocol for deep linking (SSO auth callbacks)
		// First, remove any existing registration to ensure clean state
		app.removeAsDefaultProtocolClient('firestone');

		if (process.defaultApp) {
			// Development mode - need to pass the script path with absolute path
			if (process.argv.length >= 2) {
				const scriptPath = require('path').resolve(process.argv[1]);
				console.log('[Auth] Registering protocol with script path:', scriptPath);
				app.setAsDefaultProtocolClient('firestone', process.execPath, [scriptPath]);
			}
		} else {
			// Production mode
			app.setAsDefaultProtocolClient('firestone');
		}
		console.log('[Auth] Registered firestone:// protocol handler');

		// Handle deep link when app is already running (Windows/Linux)
		// Make this instance the single instance
		const gotTheLock = app.requestSingleInstanceLock();
		if (!gotTheLock) {
			// Another instance is already running, quit this one
			app.quit();
			return;
		}

		app.on('second-instance', (event, commandLine, workingDirectory) => {
			console.log('[Auth] second-instance event, commandLine:', commandLine);

			// Find the deep link URL in command line args
			const deepLinkUrl = commandLine.find((arg) => arg.startsWith('firestone://'));
			if (deepLinkUrl) {
				App.handleAuthDeepLink(deepLinkUrl);
			}

			// Focus the main window if it exists
			if (App.mainWindow) {
				if (App.mainWindow.isMinimized()) {
					App.mainWindow.restore();
				}
				App.mainWindow.focus();
			}
		});

		// Handle deep link when app is launched via protocol (macOS)
		app.on('open-url', (event, url) => {
			event.preventDefault();
			console.log('[Auth] open-url event:', url);
			App.handleAuthDeepLink(url);
		});

		// Check if app was launched with a deep link URL (Windows - cold start)
		const deepLinkArg = process.argv.find((arg) => arg.startsWith('firestone://'));
		if (deepLinkArg) {
			// Delay handling until app is ready
			app.whenReady().then(() => {
				console.log('[Auth] App launched with deep link:', deepLinkArg);
				App.handleAuthDeepLink(deepLinkArg);
			});
		}

		// Set up IPC handler for renderer to request login
		ipcMain.handle('auth-login', async () => {
			const loginUrl = 'https://www.firestoneapp.com/login.html';
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
					const message = args.map(arg =>
						typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
					).join(' ');
					const timestamp = getTimestamp();
					const logMessage = `[${timestamp}] [${level.toUpperCase()}] [RENDERER] ${message}\n`;

					// Add to queue
					rendererLogQueue.push(logMessage);

					// Also log to console with prefix (synchronous, but console is fast)
					originalLog(`[RENDERER] [${level.toUpperCase()}]`, ...args);
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
		destroySystemTray();

		if (App.overlay) {
			await App.overlay.destroyOverlay();
		}

		if (process.platform !== 'darwin') {
			App.application.quit();
		}
	}

	private static async onWillQuit() {
		destroySystemTray();

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
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		App.mainWindow = null;
	}

	private static onRedirect(event: any, url: string) {
		if (url !== App.mainWindow.webContents.getURL()) {
			// this is a normal external redirect, open it in a new browser window
			event.preventDefault();
			shell.openExternal(url);
		}
	}

	private static async onReady() {
		// This method will be called when Electron has finished
		// initialization and is ready to create browser windows.
		// Some APIs can only be used after this event occurs.

		// Skip main window creation for overlay-only mode
		console.log('🚫 Skipping main window creation (overlay-only mode)');
		// if (rendererAppName) {
		// 	App.initMainWindow();
		// 	App.loadMainWindow();
		// }

		// Initialize game detection
		await App.initGameDetection();
		initSystemTray();
	}

	private static async initGameDetection() {
		// Initialize dependency injection system
		const electronInjector = buildAppInjector();
		setAppInjector(electronInjector);

		const diskCache = electronInjector.get(DiskCacheService) as any as ElectronDiskCacheService;
		await diskCache.init();
		console.log('[app] diskCache initialized');

		// Initialize game services
		App.gameWindow = ElectronGameWindowService.getInstance();
		App.overlay = OverlayService.getInstance();
		App.gameWindow.initialize(App.overlay);

		console.log('🔧 Registered services:', electronAppInjector.getRegisteredServices());

		// Wait for overlay to be ready before registering to games
		App.overlay.on('ready', async () => {
			console.log('🎯 Overlay service is ready!');

			// Register to monitor Hearthstone
			await App.overlay.registerToHearthstone();

			// Don't create overlay window yet - wait for game launch event
			console.log('⏳ Waiting for Hearthstone to launch...');
		});

		// Initialize MindVision service for memory reading
		const mindVision = electronInjector.get(MindVisionElectronService);
		const allCards = electronInjector.get(CardsFacadeStandaloneService);
		// const gameEventsPlugin = electronInjector.get(GameEventsElectronService);
		const gameEvents = electronInjector.get(GameEvents);
		const logListener = electronInjector.get(LogListenerService);
		// gameEventsPlugin.init((gameEvent) => {
		// 	console.log('[GameEventsElectron] [app] received event', gameEvent);
		// });
		logListener
			.configure(
				'Power.log',
				(data) => gameEvents.receiveLogLine(data),
				(existingLine) => gameEvents.receiveExistingLogLine(existingLine),
			)
			.subscribe((status) => {
				console.log('[log-register] status for Power.log', status);
			})
			.start();
		// TODO: nx graph, and remove UI dependencies (probably some transitive stuff for game-state or battelgrounds-core?)
		console.log('[app] allCards', allCards);
		allCards.init(new AllCardsService(), 'enUS');
		console.log('[app] allCards initialized', allCards.getCards()?.length ?? 'null');

		const db = electronInjector.get(DATABASE_SERVICE_TOKEN);
		await db.init();

		// Keep the old game detection for logging purposes
		// App.gameDetection.on('game-launched', (gameInfo) => {
		// 	console.log('🎮 Process detection - Game launched:', gameInfo.displayName);
		// });

		// App.gameDetection.on('game-closed', (gameInfo) => {
		// 	console.log('👋 Process detection - Game closed:', gameInfo.displayName);
		// });

		// // Start monitoring (both process detection and ow-electron overlay)
		// App.gameDetection.startMonitoring();
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

	private static initMainWindow() {
		const workAreaSize = screen.getPrimaryDisplay().workAreaSize;
		const width = Math.min(1280, workAreaSize.width || 1280);
		const height = Math.min(720, workAreaSize.height || 720);

		// Create the browser window.
		App.mainWindow = new BrowserWindow({
			width: width,
			height: height,
			show: false,
			webPreferences: {
				contextIsolation: true,
				backgroundThrottling: false,
				preload: join(__dirname, 'main.preload.js'),
			},
		});
		App.mainWindow.setMenu(null);
		App.mainWindow.center();

		// if main window is ready to show, close the splash window and show the main window
		App.mainWindow.once('ready-to-show', () => {
			// Don't show main window for overlay-only mode
			// App.mainWindow.show();
			console.log('🚫 Main window ready but not showing (overlay-only mode)');
		});

		// Don't open dev tools for main window in overlay-only mode
		if (App.isDevelopmentMode()) {
			// App.mainWindow.webContents.openDevTools(); // Disabled for overlay-only mode

			// Enable main process debugging
			console.log('🔧 Main process debugging enabled. Check terminal for main process logs.');
			console.log('🔧 To debug main process with Chrome DevTools, run: npm run debug:main');
		}

		// Add keyboard shortcut for dev tools
		App.mainWindow.webContents.on('before-input-event', (event, input) => {
			if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
				App.mainWindow.webContents.toggleDevTools();
			}
		});

		// handle all external redirects in a new browser window
		// App.mainWindow.webContents.on('will-navigate', App.onRedirect);
		// App.mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options) => {
		//     App.onRedirect(event, url);
		// });

		// Emitted when the window is closed.
		App.mainWindow.on('closed', () => {
			// Dereference the window object, usually you would store windows
			// in an array if your app supports multi windows, this is the time
			// when you should delete the corresponding element.
			App.mainWindow = null;
		});
	}

	private static loadMainWindow() {
		// load the index.html of the app.
		if (!App.application.isPackaged) {
			App.mainWindow.loadURL(`http://localhost:${rendererAppPort}`);
		} else {
			App.mainWindow.loadURL(
				format({
					pathname: join(__dirname, '..', rendererAppName, 'index.html'),
					protocol: 'file:',
					slashes: true,
				}),
			);
		}
	}
}
