import { ElectronGameWindowService } from '@firestone/electron/common';
import { overwolf } from '@overwolf/ow-electron';
import {
	GamesFilter,
	IOverwolfOverlayApi,
	OverlayBrowserWindow,
	OverlayWindowOptions,
} from '@overwolf/ow-electron-packages-types';
import { app as electronApp } from 'electron';
import EventEmitter from 'events';
import { join } from 'path';

const app = electronApp as overwolf.OverwolfApp;

export class OverlayService extends EventEmitter {
	private static instance: OverlayService;
	private isOverlayReady = false;
	private overlayWindow: OverlayBrowserWindow | null = null;
	private gameWindowService: ElectronGameWindowService;

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
	 * Destroy the overlay
	 */
	public async destroyOverlay(): Promise<void> {
		if (this.overlayWindow) {
			// Note: ow-electron manages overlay lifecycle automatically
			this.overlayWindow = null;
			console.log('💥 Overlay destroyed');
		}
	}

	/**
	 * Check if overlay is visible
	 */
	public isOverlayVisible(): boolean {
		return this.overlayWindow !== null;
	}

	/**
	 * Register to monitor Hearthstone (game ID 9898)
	 */
	public async registerToHearthstone(): Promise<void> {
		if (!this.overlayApi) {
			console.log('⚠️ Cannot register to Hearthstone - overlay API not ready');
			return;
		}

		console.log('🎮 Registering to monitor Hearthstone...');
		const filter: GamesFilter = {
			gamesIds: [9898], // Hearthstone game ID
		};

		await this.overlayApi.registerGames(filter);
		console.log('✅ Registered to monitor Hearthstone');
	}

	/**
	 * Resize existing overlay window to match current game size
	 */
	private async resizeOverlayToGame(): Promise<void> {
		if (!this.overlayWindow) {
			console.log('⚠️ No overlay window to resize');
			return;
		}

		// Get current game info from centralized service
		const gameInfo = this.gameWindowService.getCurrentGameInfo();
		console.log(`Resizing - Game info from service:`, gameInfo);

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
			console.log(`Overlay resized to: ${gameWidth}x${gameHeight}`);
		} catch (error) {
			console.error('❌ Failed to resize overlay window:', error);
		}
	}

	/**
	 * Create the Hello World overlay window
	 */
	private async createOverlayWindow(): Promise<void> {
		// Get game window information from centralized service
		const gameInfo = this.gameWindowService.getCurrentGameInfo();
		console.log(`Creating overlay - Game info from service:`, gameInfo);

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
		console.log('🔧 Preload script path:', preloadPath);
		console.log('🔧 Current __dirname:', __dirname);

		const options: OverlayWindowOptions = {
			name: 'firestone-overlay-' + Math.floor(Math.random() * 1000),
			height: gameHeight,
			width: gameWidth,
			show: true,
			transparent: true,
			resizable: false,
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

		console.log('🔧 Overlay window options:', JSON.stringify(options, null, 2));

		this.overlayWindow = await this.overlayApi.createWindow(options);

		try {
			// Load the Angular frontend instead of plain HTML
			// TODO: In production, we should serve this from a local file server or build
			const frontendUrl = 'http://localhost:4200/overlay';

			console.log('🚀 Loading Angular overlay from:', frontendUrl);
			await this.overlayWindow.window.loadURL(frontendUrl);

			// Wait for DOM to be ready, then show and focus
			this.overlayWindow.window.webContents.once('dom-ready', () => {
				console.log('Angular DOM ready, showing overlay...');
				this.overlayWindow.window.show();
				this.overlayWindow.window.focus();
				this.overlayWindow.window.setAlwaysOnTop(true);
				setTimeout(() => {
					this.overlayWindow.window.setAlwaysOnTop(false); // Reset to normal after a moment
				}, 100);
				console.log('Overlay window shown and focused after Angular DOM ready');
			});

			// Open dev tools for debugging in development mode
			this.overlayWindow.window.webContents.openDevTools({
				mode: 'detach', // Open in separate window
				activate: true, // Bring to front
			});
			if (process.env['NODE_ENV'] === 'development' || !app.isPackaged) {
				this.overlayWindow.window.webContents.openDevTools({
					mode: 'detach', // Open in separate window
					activate: true, // Bring to front
				});
				console.log('🔧 Overlay dev tools opened for debugging (detached window)');
			}

			// Add keyboard shortcut to manually open dev tools
			this.overlayWindow.window.webContents.on('before-input-event', (event, input) => {
				if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
					this.overlayWindow.window.webContents.toggleDevTools();
					console.log('🔧 Dev tools toggled manually');
				}
			});

			console.log('✨ Angular overlay window created successfully! Waiting for show/focus...');
		} catch (error) {
			console.error('❌ Error loading Angular overlay:', error);
			console.error('❌ Make sure Angular frontend is running on http://localhost:4200');
			// Don't create fallback window - just fail gracefully
			throw error;
		}
	}

	/**
	 * Wait for overlay package to be ready
	 */
	private startOverlayWhenPackageReady(): void {
		app.overwolf.packages.on('ready', (e, packageName, version) => {
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
		this.emit('ready');
	}

	/**
	 * Register event handlers for overlay events
	 */
	private registerOverlayEvents(): void {
		// Prevent double events in case the package relaunches due to crash or update
		this.overlayApi.removeAllListeners();

		console.log('📡 Registering to overlay package events');

		this.overlayApi.on('game-launched', async (event, gameInfo) => {
			console.log('🎮 Game launched:', gameInfo.name);
			console.log('🔍 Game ID:', gameInfo.id, '(looking for 9898 for Hearthstone)');
			// console.log('🔍 Process info:', JSON.stringify(gameInfo.processInfo, null, 2));
			// console.log('🔍 Window info:', JSON.stringify(gameInfo, null, 2));

			// Check if this is Hearthstone (ID 9898)
			if (Math.round(gameInfo.id / 10) === 9898) {
				console.log('Hearthstone detected! Injecting first...');

				// Check for elevation issues
				if (gameInfo.processInfo.isElevated) {
					console.error('❌ Cannot inject to elevated game - app is not elevated');
					return;
				}

				// Try injecting FIRST, then create window in the injected event
				console.log('🚀 Calling event.inject() BEFORE creating window...');
				try {
					event.inject();
					console.log('✅ event.inject() called successfully');
				} catch (error) {
					console.error('❌ Error calling event.inject():', error);
				}
			} else {
				console.log(`ℹ️ Game ${gameInfo.name} (ID: ${gameInfo.id}) launched, but not Hearthstone`);
			}
		});

		this.overlayApi.on('game-injection-error', (gameInfo, error) => {
			console.error('❌ Game injection error:', error, gameInfo);
		});

		this.overlayApi.on('game-injected', async (gameInfo) => {
			console.log('Game injected successfully!', gameInfo.name);
			console.log('Waiting for game to get focus before creating overlay...');
		});

		this.overlayApi.on('game-focus-changed', async (window, game, focus) => {
			// console.log('🔍 Game focus changed:', game.name, focus ? 'focused' : 'unfocused');

			if (game.classId === 9898) {
				if (focus) {
					// Game focused - create or resize overlay
					if (!this.overlayWindow) {
						console.log('Hearthstone focused! Creating overlay window...');
						await this.createOverlayWindow();
						console.log('Overlay window created when game got focus!');
					} else {
						// console.log('Hearthstone focused! Resizing existing overlay...');
						await this.resizeOverlayToGame();
						// console.log('Overlay window resized to match current game size!');
					}
				} else {
					// Game unfocused - hide overlay but keep it alive
					// if (this.overlayWindow) {
					// 	console.log('Hearthstone unfocused! Hiding overlay...');
					// 	this.overlayWindow.window.hide();
					// }
				}
			}
		});

		this.overlayApi.on('game-window-changed', async (window, game, reason) => {
			console.log('Game window changed:', reason, game.name);

			if (game.classId === 9898 && this.overlayWindow) {
				console.log('Hearthstone window changed! Resizing overlay...');
				await this.resizeOverlayToGame();
			}
		});

		this.overlayApi.on('game-input-interception-changed', (info) => {
			console.log('⌨️ Input interception changed:', info);
		});

		this.overlayApi.on('game-input-exclusive-mode-changed', (info) => {
			console.log('🎮 Input exclusive mode changed:', info);
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
}
