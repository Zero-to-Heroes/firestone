/// <reference types="@overwolf/ow-electron/mix" />
import { ElectronGameWindowService } from '@firestone/electron/common';
import { NotificationsService, StandaloneAdService } from '@firestone/shared/common/service';
import { AppInjector, ILocalizationService } from '@firestone/shared/framework/core';
import {
	GamesFilter,
	IOverwolfOverlayApi,
	OverlayBrowserWindow,
	OverlayWindowOptions,
} from '@overwolf/ow-electron-packages-types';
import { app as electronApp } from 'electron';
import EventEmitter from 'events';
import { join } from 'path';
import { Subscription } from 'rxjs';
import App from '../app';
import { formatLogArg } from '../format-log-arg';
import { appAccessUnlocked$$, isAppAccessUnlocked } from './app-access-policy';

// Electron.App is augmented by @overwolf/ow-electron/mix (app.overwolf).
const app = electronApp;

export class OverlayService extends EventEmitter {
	private static instance: OverlayService;
	private isOverlayReady = false;
	private overlayWindow: OverlayBrowserWindow | null = null;
	private gameWindowService: ElectronGameWindowService;
	private appAccessSubscription: Subscription | null = null;

	public get overlayApi(): IOverwolfOverlayApi {
		// Do not let the application access the overlay before it is ready
		if (!this.isOverlayReady) {
			return null;
		}
		return (app.overwolf.packages as any).overlay as IOverwolfOverlayApi;
	}

	private constructor() {
		super();
		this.gameWindowService = ElectronGameWindowService.getInstance();
		this.startOverlayWhenPackageReady();
	}

	public static getInstance(): OverlayService {
		if (!OverlayService.instance) {
			OverlayService.instance = new OverlayService();
		}
		return OverlayService.instance;
	}

	/**
	 * Show the Hello World overlay when Hearthstone is detected
	 * Note: This is now handled automatically by the game-launched event
	 */
	public async showOverlay(): Promise<void> {
		console.log('ℹ️ Overlay creation is now handled automatically when Hearthstone launches');
	}

	/**
	 * Hide the overlay
	 */
	public async hideOverlay(): Promise<void> {
		if (this.overlayWindow) {
			// Note: The overlay window will be automatically hidden when game closes
			// due to ow-electron's injection system
			console.log('🙈 Overlay will be hidden with game');
		}
	}

	/**
	 * Destroy the overlay.
	 * Must be called on game-exit: ow-electron can leave a non-destroyed BrowserWindow
	 * whose render frame is already disposed (zombie overlay — visible but dead).
	 */
	public async destroyOverlay(): Promise<void> {
		if (!this.overlayWindow) {
			return;
		}
		const window = this.overlayWindow.window;
		this.overlayWindow = null;
		try {
			if (window && !window.isDestroyed()) {
				window.close();
			}
		} catch (error) {
			console.warn('[Overlay] Error destroying overlay window:', error);
		}
		console.log('💥 Overlay destroyed');
	}

	/**
	 * Check if overlay is visible
	 */
	public isOverlayVisible(): boolean {
		return this.overlayWindow !== null;
	}

	/**
	 * Returns true if we should create an overlay (none, destroyed, or zombie with disposed frame).
	 * Clears the stale reference before returning true.
	 */
	private shouldCreateOverlay(): boolean {
		if (!this.overlayWindow) {
			console.log('shouldCreateOverlay: no overlay window');
			return true;
		}
		if (this.isOverlayWindowUnhealthy()) {
			console.log('shouldCreateOverlay: overlay window unhealthy, destroying before recreate');
			void this.destroyOverlay();
			return true;
		}
		return false;
	}

	/**
	 * Detect zombie overlays: BrowserWindow may still exist after injection teardown
	 * while webContents / render frame are already gone.
	 */
	private isOverlayWindowUnhealthy(): boolean {
		try {
			const window = this.overlayWindow?.window;
			if (!window || window.isDestroyed()) {
				return true;
			}
			const webContents = window.webContents;
			if (!webContents || webContents.isDestroyed()) {
				return true;
			}
			// Probe: disposed frames can throw even when isDestroyed() is false
			webContents.getURL();
			return false;
		} catch (error) {
			console.log('shouldCreateOverlay: overlay probe failed, treating as unhealthy', error);
			return true;
		}
	}

	/**
	 * Register to monitor Hearthstone (game ID 9898)
	 */
	public async registerToHearthstone(): Promise<void> {
		if (!this.overlayApi) {
			console.log('Cannot register to Hearthstone - overlay API not ready');
			return;
		}

		console.log('🎮 Registering to monitor Hearthstone...');
		const filter: GamesFilter = {
			gamesIds: [9898], // Hearthstone game ID
		};

		await this.overlayApi.registerGames(filter);
		console.log('Registered to monitor Hearthstone');
	}

	/**
	 * Resize existing overlay window to match current game size
	 */
	private async resizeOverlayToGame(): Promise<void> {
		if (!isAppAccessUnlocked()) {
			return;
		}
		if (!this.overlayWindow) {
			console.log('No overlay window to resize');
			return;
		}

		// Get current game info from centralized service
		const gameInfo = this.gameWindowService.getCurrentGameInfo();
		// console.log(`Resizing - Game info from service:`, gameInfo);

		if (!gameInfo) {
			console.log(`No game info available for resize, keeping current size`);
			return;
		}

		const gameWidth = gameInfo.width;
		const gameHeight = gameInfo.height;

		// Resize the existing window
		try {
			this.overlayWindow.window.setSize(gameWidth, gameHeight);
			this.overlayWindow.window.setPosition(0, 0);
			this.overlayWindow.window.show(); // Make sure it's visible
			// console.log(`Overlay resized to: ${gameWidth}x${gameHeight}`);
		} catch (error) {
			console.error('Failed to resize overlay window:', error);
		}
	}

	/**
	 * Create the Hello World overlay window
	 */
	private async createOverlayWindow(): Promise<void> {
		if (!isAppAccessUnlocked()) {
			console.log('[Overlay] Skipping overlay window — full app not unlocked (premium + login required)');
			return;
		}
		// Get game window information from centralized service
		const gameInfo = this.gameWindowService.getCurrentGameInfo();
		console.debug(`Creating overlay - Game info from service:`, gameInfo);

		// Use game dimensions or fallback to defaults
		let gameWidth = 1920;
		let gameHeight = 1080;

		if (gameInfo) {
			gameWidth = gameInfo.width;
			gameHeight = gameInfo.height;
			console.log(`Using game dimensions from service: ${gameWidth}x${gameHeight}`);
		} else {
			console.log(`No game info available, using defaults: ${gameWidth}x${gameHeight}`);
		}

		console.log(`Final overlay dimensions: ${gameWidth}x${gameHeight}`);

		const preloadPath = join(__dirname, 'main.preload.js');
		console.log('Preload script path:', preloadPath);
		console.log('Current __dirname:', __dirname);

		const options: OverlayWindowOptions & { dpiAware?: boolean } = {
			name: 'firestone-overlay-' + Math.floor(Math.random() * 1000),
			height: gameHeight,
			width: gameWidth,
			show: true,
			transparent: true,
			resizable: false,
			dpiAware: false,
			webPreferences: {
				devTools: true,
				nodeIntegration: true,
				contextIsolation: false,
				preload: preloadPath,
			},
			// Position at top-left to cover entire game window
			x: 0,
			y: 0,
		};

		console.debug('Overlay window options:', formatLogArg(options));

		this.overlayWindow = await this.overlayApi.createWindow(options);

		this.overlayWindow.window.once('closed', () => {
			this.overlayWindow = null;
		});

		try {
			// Load the Angular frontend - from bundled files in production, or dev server in development
			let frontendUrl: string;

			if (electronApp.isPackaged) {
				// Production: load from bundled frontend files
				// The frontend is copied to 'electron-frontend' folder via extraFiles in electron-builder.yml
				const frontendDir = join(process.resourcesPath, 'electron-frontend');
				const frontendPath = join(frontendDir, 'index.html');

				// Check if file exists
				const fs = require('fs');
				if (!fs.existsSync(frontendPath)) {
					console.error('Frontend file not found at:', frontendPath);
					console.error('Available resources:', process.resourcesPath);
					try {
						const resourcesContents = fs.readdirSync(process.resourcesPath);
						console.error('Resources directory contents:', resourcesContents);
					} catch (e) {
						console.error('Could not read resources directory:', e);
					}
					throw new Error(`Frontend file not found: ${frontendPath}`);
				}

				// Convert to file:// URL format
				let normalizedPath = frontendPath.replace(/\\/g, '/');
				normalizedPath = normalizedPath.replace(/^([a-z]):/i, (match, drive) => drive.toUpperCase() + ':');
				frontendUrl = `file:///${normalizedPath}#/overlay`;
				console.log('Loading Angular overlay from bundled files:', frontendUrl);
				console.log('Frontend directory:', frontendDir);

				// Set up error handlers for debugging
				this.overlayWindow.window.webContents.on(
					'did-fail-load',
					(event, errorCode, errorDescription, validatedURL, isMainFrame) => {
						if (isMainFrame) {
							console.error('Overlay main frame failed to load:', {
								errorCode,
								errorDescription,
								validatedURL,
								frontendPath,
							});
						} else {
							console.error('Resource failed to load:', {
								errorCode,
								errorDescription,
								validatedURL,
							});
						}
					},
				);
			} else {
				// Development: load from dev server
				frontendUrl = 'http://localhost:4200/overlay';
				console.log('Loading Angular overlay from dev server:', frontendUrl);
			}

			// Set up dev tools opening BEFORE loading URL (in case page loads quickly)
			if (App.isDevelopmentMode()) {
				console.log('🔧 Setting up dev tools for overlay window (dev mode)');

				// Also try on did-finish-load as a fallback
				this.overlayWindow.window.webContents.once('did-finish-load', () => {
					// Only open if not already open
					if (!this.overlayWindow.window.webContents.isDevToolsOpened()) {
						console.log('🔧 Page finished loading - opening dev tools');
						this.overlayWindow.window.webContents.openDevTools({
							mode: 'detach',
							activate: true,
						});
						console.log('✅ Overlay dev tools opened (detached window)');
					}
				});
			}

			await this.overlayWindow.window.loadURL(frontendUrl);

			// Wait for DOM to be ready, then show and focus, and open dev tools
			this.overlayWindow.window.webContents.once('dom-ready', () => {
				console.log('Angular DOM ready, showing overlay...');
				this.overlayWindow.window.show();
				this.overlayWindow.window.focus();
				this.overlayWindow.window.setAlwaysOnTop(true);
				setTimeout(() => {
					this.overlayWindow.window.setAlwaysOnTop(false); // Reset to normal after a moment
				}, 100);
				console.log('Overlay window shown and focused after Angular DOM ready');

				// Open dev tools in development mode
				if (App.isDevelopmentMode()) {
					console.log('🔧 DOM ready - opening dev tools');
					this.overlayWindow.window.webContents.openDevTools({
						mode: 'detach', // Open in separate window
						activate: true, // Bring to front
					});
					console.log('✅ Overlay dev tools opened (detached window)');
				}
			});

			// Add keyboard shortcut to manually open dev tools
			this.overlayWindow.window.webContents.on('before-input-event', (event, input) => {
				if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
					this.overlayWindow.window.webContents.toggleDevTools();
					console.log('Dev tools toggled manually');
				}
			});

			// Show a notification for premium users only (free users get the loading+ad window)
			const ads = AppInjector.get(StandaloneAdService);
			const shouldShowAds = await ads.shouldDisplayAds();
			if (!shouldShowAds) {
				const notificationsService = AppInjector.get(NotificationsService);
				const localizationService = AppInjector.get(ILocalizationService);
				const title = localizationService.translateString('app.internal.startup.firestone-ready-title');
				const text = localizationService.translateString('app.internal.startup.firestone-ready-text');
				notificationsService.emitNewNotification({
					content: `
					<div class="general-message-container general-theme">
						<div class="firestone-icon">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
							</svg>
						</div>
						<div class="message">
							<div class="title">
								<span>${title}</span>
							</div>
							<span class="text">${text}</span>
						</div>
						<button class="i-30 close-button">
							<svg class="svg-icon-fill">
								<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
							</svg>
						</button>
					</div>`,
					notificationId: `app-ready`,
				});
			}

			console.log('Angular overlay window created successfully! Waiting for show/focus...');
		} catch (error) {
			console.error('Error loading Angular overlay:', error);
			console.error('Make sure Angular frontend is running on http://localhost:4200');
			// Don't create fallback window - just fail gracefully
			throw error;
		}
	}

	/**
	 * Wait for overlay package to be ready
	 */
	private startOverlayWhenPackageReady(): void {
		app.overwolf.packages.on('ready', (e, packageName, version) => {
			console.log('Overlay package ready:', packageName, version);
			if (packageName !== 'overlay') {
				return;
			}

			this.isOverlayReady = true;
			this.startOverlay(version);
		});
	}

	/**
	 * Initialize overlay after package is ready
	 */
	private startOverlay(version: string): void {
		if (!this.overlayApi) {
			throw new Error('Attempting to access overlay before available');
		}

		console.log(`Overlay package is ready: ${version}`);
		this.registerOverlayEvents();
		this.subscribeToGameInfoChanges();
		this.subscribeToGameExit();
		this.setupAppAccessSubscription();
		this.emit('ready');
	}

	/**
	 * Tear down the main overlay on HS exit so the next inject creates a fresh window.
	 * Without this, shouldCreateOverlay() keeps a zombie ref and skips recreate.
	 */
	private subscribeToGameExit(): void {
		this.gameWindowService.onGameExit(() => {
			console.log('[Overlay] Hearthstone exited — destroying overlay window');
			void this.destroyOverlay();
		});
	}

	private setupAppAccessSubscription(): void {
		this.appAccessSubscription?.unsubscribe();
		this.appAccessSubscription = appAccessUnlocked$$.subscribe((unlocked) => {
			if (!unlocked) {
				void this.destroyOverlay();
			} else {
				void this.tryCreateOverlayAfterUnlock();
			}
		});
	}

	/**
	 * If the user was locked when HS started, we still injected; game-injected skipped window creation.
	 * When access unlocks, create the overlay if a game is already running and we have no window yet.
	 */
	private async tryCreateOverlayAfterUnlock(): Promise<void> {
		if (!isAppAccessUnlocked() || !this.shouldCreateOverlay()) {
			return;
		}
		const gameInfo = this.gameWindowService.getCurrentGameInfo();
		if (!gameInfo) {
			console.log(
				'[Overlay] App unlocked but no cached game window info yet — overlay will be created on Hearthstone focus or next injection flow',
			);
			return;
		}
		console.log('[Overlay] App unlocked with game already running — creating overlay window');
		await this.createOverlayWindow();
	}

	/**
	 * Subscribe to game info changes from the centralized service
	 * This ensures the overlay is resized AFTER the game info has been updated
	 */
	private subscribeToGameInfoChanges(): void {
		this.gameWindowService.onGameInfoChanged((gameInfo) => {
			if (gameInfo && this.overlayWindow) {
				// console.log(`Game info changed, resizing overlay to: ${gameInfo.width}x${gameInfo.height}`);
				this.resizeOverlayToGame();
			}
		});
		console.log('Subscribed to game info changes for overlay resizing');
	}

	/**
	 * Register event handlers for overlay events
	 */
	private registerOverlayEvents(): void {
		// Prevent double events in case the package relaunches due to crash or update
		this.overlayApi.removeAllListeners();

		console.log('Registering to overlay package events');

		this.overlayApi.on('game-launched', async (event, gameInfo) => {
			console.log('Game launched:', gameInfo.name);
			console.log('Game ID:', gameInfo.id, '(looking for 9898 for Hearthstone)');
			// console.log('Process info:', JSON.stringify(gameInfo.processInfo, null, 2));
			// console.log('Window info:', JSON.stringify(gameInfo, null, 2));

			// Check if this is Hearthstone (ID 9898)
			if (Math.round(gameInfo.id / 10) === 9898) {
				// Check for elevation issues
				if (gameInfo.processInfo.isElevated) {
					console.error('Cannot inject to elevated game - app is not elevated');
					const notificationsService = AppInjector.get(NotificationsService);
					notificationsService.notifyError(
						'Could not inject',
						'The game is running as administrator, so you need to run Firestone as an administrator to enable game injection.',
						'game-injection-error',
					);
					return;
				}

				// Always inject when HS launches (ow-electron needs this for in-game compositing), even
				// if the full app is still locked. We only skip creating the overlay window until unlock.
				if (!isAppAccessUnlocked()) {
					console.log(
						'[Overlay] Hearthstone launched while full app locked — still calling inject; overlay window will be created when unlocked (or on focus)',
					);
				} else {
					console.log('Hearthstone detected! Injecting first...');
				}

				// Try injecting FIRST, then create window in the injected event
				console.log('Calling event.inject() BEFORE creating window...');
				try {
					event.inject();
					console.log('event.inject() called successfully');
				} catch (error) {
					console.error('Error calling event.inject():', error);
				}
			} else {
				console.log(`Game ${gameInfo.name} (ID: ${gameInfo.id}) launched, but not Hearthstone`);
			}
		});

		this.overlayApi.on('game-injection-error', (gameInfo, error) => {
			console.error('Game injection error:', error, gameInfo);
		});

		this.overlayApi.on('game-injected', async (gameInfo) => {
			console.log('Game injected successfully!', gameInfo.name);
			if (!isAppAccessUnlocked()) {
				console.log('[Overlay] Skipping overlay after injection — full app not unlocked');
				return;
			}
			// shouldCreateOverlay destroys zombies (disposed render frame) before returning true
			if (!this.shouldCreateOverlay()) {
				console.log('[Overlay] Healthy overlay already exists after inject — keeping it');
				return;
			}
			console.log('Hearthstone injected! Creating overlay window...');
			await this.createOverlayWindow();
			console.log('Overlay window created when game was injected!');
		});

		this.overlayApi.on('game-focus-changed', async (window, game, focus) => {
			if (game.classId === 9898 && focus) {
				if (!isAppAccessUnlocked()) {
					return;
				}
				// Resizing is handled by subscribeToGameInfoChanges() callback
				if (!this.shouldCreateOverlay()) {
					return;
				}
				console.log('Hearthstone focused! Creating overlay window...');
				await this.createOverlayWindow();
				console.log('Overlay window created when game got focus!');
			}
		});

		this.overlayApi.on('game-window-changed', async (window, game, reason) => {
			// console.log('Game window changed:', reason, game.name);
			// Note: Resizing is now handled by onGameInfoChanged callback in subscribeToGameInfoChanges()
			// This ensures the overlay is resized AFTER ElectronGameWindowService has updated its cached info
		});

		this.overlayApi.on('game-input-interception-changed', (info) => {
			console.log('Input interception changed:', info);
		});

		this.overlayApi.on('game-input-exclusive-mode-changed', (info) => {
			console.log('Input exclusive mode changed:', info);
		});
	}

	/**
	 * Update the decktracker widget with new deck data
	 */
	public updateDeckData(deckData: any) {
		if (this.overlayWindow && this.overlayWindow.window) {
			try {
				// Execute JavaScript in the overlay window to update the deck data
				const deckDataJson = JSON.stringify(deckData).replace(/'/g, "\\'");
				this.overlayWindow.window.webContents.executeJavaScript(`
					if (window.updateDeckData) {
						window.updateDeckData(${deckDataJson});
					}
				`);
			} catch (error) {
				console.error('❌ Error updating deck data:', error);
			}
		}
	}

	/**
	 * Send an IPC message to the overlay window
	 */
	public sendToOverlay(channel: string, ...args: any[]): void {
		if (this.overlayWindow && this.overlayWindow.window) {
			try {
				this.overlayWindow.window.webContents.send(channel, ...args);
			} catch (error) {
				console.error(`[OverlayService] Error sending IPC message to overlay (${channel}):`, error);
			}
		}
	}
}
