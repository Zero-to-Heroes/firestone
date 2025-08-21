import { overwolf } from '@overwolf/ow-electron';
import {
	GamesFilter,
	IOverwolfOverlayApi,
	OverlayBrowserWindow,
	OverlayWindowOptions,
} from '@overwolf/ow-electron-packages-types';
import { app as electronApp } from 'electron';
import EventEmitter from 'events';

const app = electronApp as overwolf.OverwolfApp;

export class OverlayService extends EventEmitter {
	private static instance: OverlayService;
	private isOverlayReady = false;
	private overlayWindow: OverlayBrowserWindow | null = null;

	public get overlayApi(): IOverwolfOverlayApi {
		// Do not let the application access the overlay before it is ready
		if (!this.isOverlayReady) {
			return null;
		}
		return (app.overwolf.packages as any).overlay as IOverwolfOverlayApi;
	}

	private constructor() {
		super();
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
	 * Create the Hello World overlay window
	 */
	private async createOverlayWindow(): Promise<void> {
		const options: OverlayWindowOptions = {
			name: 'firestone-hello-world-' + Math.floor(Math.random() * 1000),
			height: 200,
			width: 400,
			show: true,
			transparent: true,
			resizable: false,
			webPreferences: {
				devTools: true,
				nodeIntegration: true,
				contextIsolation: false,
			},
			// Position at top-left area
			x: 100,
			y: 100,
		};

		const activeGame = this.overlayApi.getActiveGameInfo();
		const gameWindowInfo = activeGame?.gameWindowInfo;
		const screenWidth = gameWindowInfo?.size.width || 500;
		options.x = Math.floor(Math.random() * (screenWidth - options.width));
		options.y = 10;

		this.overlayWindow = await this.overlayApi.createWindow(options);

		// Load our Hello World HTML using the correct method from the sample
		const overlayHtml = this.createOverlayHtml();

		try {
			// Use the window property like in the official sample
			await this.overlayWindow.window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(overlayHtml)}`);

			// Show the window (like in the sample)
			this.overlayWindow.window.show();

			console.log('✨ Overlay window created and shown successfully!');
		} catch (error) {
			console.error('❌ Error loading HTML into overlay window:', error);
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

		console.log(`🎯 Overlay package is ready: ${version}`);
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
			console.log('🔍 Process info:', JSON.stringify(gameInfo.processInfo, null, 2));
			console.log('🔍 Window info:', JSON.stringify(gameInfo, null, 2));

			// Check if this is Hearthstone (ID 9898)
			if (Math.round(gameInfo.id / 10) === 9898) {
				console.log('🎯 Hearthstone detected! Injecting first...');

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
			console.log('✨ Game injected successfully!', gameInfo.name);
			console.log('🎯 Now creating overlay window...');
			
			// Create overlay window AFTER successful injection
			if (!this.overlayWindow) {
				await this.createOverlayWindow();
				console.log('🎯 Overlay window created after injection - should be visible in game!');
			}
		});

		this.overlayApi.on('game-focus-changed', (window, game, focus) => {
			console.log('🔍 Game focus changed:', game.name, focus ? 'focused' : 'unfocused');
		});

		this.overlayApi.on('game-window-changed', (window, game, reason) => {
			console.log('📐 Game window changed:', reason, game.name);
		});

		this.overlayApi.on('game-input-interception-changed', (info) => {
			console.log('⌨️ Input interception changed:', info);
		});

		this.overlayApi.on('game-input-exclusive-mode-changed', (info) => {
			console.log('🎮 Input exclusive mode changed:', info);
		});
	}

	/**
	 * Create the Hello World overlay HTML
	 */
	private createOverlayHtml(): string {
		return `
			<!DOCTYPE html>
			<html>
				<head>
					<meta charset="utf-8">
					<title>Firestone Overlay</title>
					<style>
						* {
							margin: 0;
							padding: 0;
							box-sizing: border-box;
						}
						
						body {
							font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
							background: transparent;
							overflow: hidden;
							width: 100vw;
							height: 100vh;
							display: flex;
							align-items: center;
							justify-content: center;
						}
						
						.overlay-container {
							background: rgba(0, 0, 0, 0.8);
							border: 2px solid #ff6b35;
							border-radius: 12px;
							padding: 20px 30px;
							text-align: center;
							box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
							backdrop-filter: blur(5px);
							animation: fadeIn 0.5s ease-in-out;
						}
						
						.title {
							color: #ff6b35;
							font-size: 24px;
							font-weight: bold;
							margin-bottom: 10px;
							text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
						}
						
						.subtitle {
							color: #ffffff;
							font-size: 16px;
							opacity: 0.9;
							text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
						}
						
						@keyframes fadeIn {
							from {
								opacity: 0;
								transform: translateY(-20px);
							}
							to {
								opacity: 1;
								transform: translateY(0);
							}
						}
						
						.pulse {
							animation: pulse 2s infinite;
						}
						
						@keyframes pulse {
							0% { transform: scale(1); }
							50% { transform: scale(1.05); }
							100% { transform: scale(1); }
						}
					</style>
				</head>
				<body>
					<div class="overlay-container pulse">
						<div class="title">🔥 Hello World! 🔥</div>
						<div class="subtitle">True Game Injection!</div>
					</div>
				</body>
			</html>
		`;
	}
}
