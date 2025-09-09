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
		console.log(`🎯 Resizing - Game info from service:`, gameInfo);

		if (!gameInfo) {
			console.log(`🎯 No game info available for resize, keeping current size`);
			return;
		}

		const gameWidth = gameInfo.width;
		const gameHeight = gameInfo.height;

		// Resize the existing window
		try {
			this.overlayWindow.window.setSize(gameWidth, gameHeight);
			this.overlayWindow.window.setPosition(0, 0);
			this.overlayWindow.window.show(); // Make sure it's visible
			console.log(`🎯 Overlay resized to: ${gameWidth}x${gameHeight}`);
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
		console.log(`🎯 Creating overlay - Game info from service:`, gameInfo);

		// Use game dimensions or fallback to defaults
		let gameWidth = 1920;
		let gameHeight = 1080;

		if (gameInfo) {
			gameWidth = gameInfo.width;
			gameHeight = gameInfo.height;
			console.log(`🎯 Using game dimensions from service: ${gameWidth}x${gameHeight}`);
		} else {
			console.log(`🎯 No game info available, using defaults: ${gameWidth}x${gameHeight}`);
		}

		console.log(`🎯 Final overlay dimensions: ${gameWidth}x${gameHeight}`);

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
				console.log('🎯 Angular DOM ready, showing overlay...');
				this.overlayWindow.window.show();
				this.overlayWindow.window.focus();
				this.overlayWindow.window.setAlwaysOnTop(true);
				setTimeout(() => {
					this.overlayWindow.window.setAlwaysOnTop(false); // Reset to normal after a moment
				}, 100);
				console.log('🎯 Overlay window shown and focused after Angular DOM ready');
			});

			// Open dev tools for debugging in development mode
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
			console.log('🎯 Waiting for game to get focus before creating overlay...');
		});

		this.overlayApi.on('game-focus-changed', async (window, game, focus) => {
			console.log('🔍 Game focus changed:', game.name, focus ? 'focused' : 'unfocused');

			if (game.classId === 9898) {
				if (focus) {
					// Game focused - create or resize overlay
					if (!this.overlayWindow) {
						console.log('🎯 Hearthstone focused! Creating overlay window...');
						await this.createOverlayWindow();
						console.log('🎯 Overlay window created when game got focus!');
					} else {
						console.log('🎯 Hearthstone focused! Resizing existing overlay...');
						await this.resizeOverlayToGame();
						console.log('🎯 Overlay window resized to match current game size!');
					}
				} else {
					// Game unfocused - hide overlay but keep it alive
					// if (this.overlayWindow) {
					// 	console.log('🎯 Hearthstone unfocused! Hiding overlay...');
					// 	this.overlayWindow.window.hide();
					// }
				}
			}
		});

		this.overlayApi.on('game-window-changed', async (window, game, reason) => {
			console.log('📐 Game window changed:', reason, game.name);

			if (game.classId === 9898 && this.overlayWindow) {
				console.log('🎯 Hearthstone window changed! Resizing overlay...');
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
	 * Create the scene display overlay HTML
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
							align-items: flex-start;
							justify-content: flex-end;
							padding: 20px;
						}
						
						.overlay-container {
							background: rgba(0, 0, 0, 0.9);
							border: 2px solid #ff6b35;
							border-radius: 12px;
							padding: 15px 20px;
							text-align: center;
							box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
							backdrop-filter: blur(5px);
							animation: fadeIn 0.5s ease-in-out;
							min-width: 200px;
						}
						
						.title {
							color: #ff6b35;
							font-size: 18px;
							font-weight: bold;
							margin-bottom: 8px;
							text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
						}
						
						.scene-display {
							color: #ffffff;
							font-size: 12px;
							font-weight: bold;
							margin-bottom: 5px;
							text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
							font-family: 'Courier New', monospace;
							background: rgba(255, 107, 53, 0.1);
							padding: 8px 12px;
							border-radius: 6px;
							border: 1px solid rgba(255, 107, 53, 0.3);
							max-height: 300px;
							overflow-y: auto;
							white-space: pre-wrap;
							word-break: break-all;
							line-height: 1.4;
						}
						
						.status {
							color: #cccccc;
							font-size: 12px;
							opacity: 0.8;
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
						
						.scene-change {
							animation: sceneChange 0.3s ease-in-out;
						}
						
						@keyframes sceneChange {
							0% { transform: scale(1); background: rgba(255, 107, 53, 0.1); }
							50% { transform: scale(1.1); background: rgba(255, 107, 53, 0.3); }
							100% { transform: scale(1); background: rgba(255, 107, 53, 0.1); }
						}

						/* Decktracker Widget Styles */
						.decktracker-widget {
							position: fixed;
							top: 20px;
							left: 20px;
							width: 250px;
							background: rgba(0, 0, 0, 0.9);
							border: 1px solid #444;
							border-radius: 6px;
							font-size: 12px;
							color: #fff;
							backdrop-filter: blur(5px);
							pointer-events: auto;
							z-index: 1000;
						}

						.decktracker-widget.hidden {
							display: none;
						}

						.widget-title-bar {
							background: rgba(255, 255, 255, 0.1);
							padding: 8px 12px;
							display: flex;
							justify-content: space-between;
							align-items: center;
							border-bottom: 1px solid #444;
							cursor: move;
						}

						.widget-title {
							font-weight: bold;
							font-size: 13px;
						}

						.toggle-btn {
							background: none;
							border: none;
							color: #fff;
							cursor: pointer;
							font-size: 16px;
							padding: 0;
							width: 20px;
							height: 20px;
							display: flex;
							align-items: center;
							justify-content: center;
						}

						.toggle-btn:hover {
							background: rgba(255, 255, 255, 0.1);
							border-radius: 3px;
						}

						.widget-content {
							padding: 12px;
							max-height: 400px;
							overflow-y: auto;
						}

						.deck-info {
							margin-bottom: 12px;
						}

						.deck-name {
							margin: 0 0 6px 0;
							font-size: 14px;
							color: #ffd700;
						}

						.deck-stats {
							display: flex;
							gap: 8px;
							font-size: 11px;
						}

						.wins { color: #4caf50; }
						.losses { color: #f44336; }
						.winrate { color: #2196f3; }

						.card-list {
							display: flex;
							flex-direction: column;
							gap: 2px;
						}

						.card-item {
							display: flex;
							justify-content: space-between;
							padding: 3px 6px;
							border-radius: 3px;
							transition: background-color 0.2s ease;
						}

						.card-item.remaining {
							background: rgba(76, 175, 80, 0.1);
						}

						.card-item.used {
							background: rgba(255, 255, 255, 0.05);
							opacity: 0.6;
						}

						.card-name {
							flex: 1;
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
						}

						.card-count {
							font-weight: bold;
							min-width: 30px;
							text-align: right;
						}

						.card-item.remaining .card-count {
							color: #4caf50;
						}

						.card-item.used .card-count {
							color: #f44336;
						}

						.no-deck {
							text-align: center;
							padding: 20px;
							color: #999;
						}
					</style>
				</head>
				<body>
					<!-- Debug Info Widget -->
					<div class="overlay-container">
						<div class="title">🔥 Firestone</div>
						<div class="scene-display" id="current-scene">Loading...</div>
						<div class="status" id="status">Initializing...</div>
					</div>

					<!-- Decktracker Widget -->
					<div class="decktracker-widget" id="decktracker-widget">
						<div class="widget-title-bar">
							<span class="widget-title">Deck Tracker</span>
							<button class="toggle-btn" onclick="toggleDecktracker()" aria-label="Toggle visibility">−</button>
						</div>
						
						<div class="widget-content" id="widget-content">
							<div class="deck-info" id="deck-info" style="display: none;">
								<h3 class="deck-name" id="deck-name">Current Deck</h3>
								<div class="deck-stats">
									<span class="wins" id="deck-wins">0W</span>
									<span class="losses" id="deck-losses">0L</span>
									<span class="winrate" id="deck-winrate">0%</span>
								</div>
							</div>
							
							<div class="card-list" id="card-list"></div>
							
							<div class="no-deck" id="no-deck">
								<p>No deck detected</p>
								<p>Waiting for game data...</p>
							</div>
						</div>
					</div>
					
					<script>
						let decktrackerVisible = true;
						let currentDeckData = null;

						// Function to update the scene display
						function updateScene(scene, status) {
							const sceneElement = document.getElementById('current-scene');
							const statusElement = document.getElementById('status');
							
							if (sceneElement) {
								let displayText = scene || 'Unknown';
								
								// Try to format as JSON if it looks like JSON
								try {
									if (typeof scene === 'string' && (scene.startsWith('{') || scene.startsWith('['))) {
										const parsed = JSON.parse(scene);
										displayText = JSON.stringify(parsed, null, 2);
									}
								} catch (e) {
									// If not valid JSON, use as-is
									displayText = scene || 'Unknown';
								}
								
								if (sceneElement.textContent !== displayText) {
									sceneElement.textContent = displayText;
									sceneElement.classList.add('scene-change');
									setTimeout(() => sceneElement.classList.remove('scene-change'), 300);
								}
							}
							
							if (statusElement) {
								statusElement.textContent = status || 'Connected';
							}
						}
						
						// Function to toggle decktracker visibility
						function toggleDecktracker() {
							const content = document.getElementById('widget-content');
							const button = document.querySelector('.toggle-btn');
							
							decktrackerVisible = !decktrackerVisible;
							
							if (decktrackerVisible) {
								content.style.display = 'block';
								button.textContent = '−';
							} else {
								content.style.display = 'none';
								button.textContent = '+';
							}
						}

						// Function to update deck data
						function updateDeckData(deckData) {
							currentDeckData = deckData;
							
							const deckInfo = document.getElementById('deck-info');
							const cardList = document.getElementById('card-list');
							const noDeck = document.getElementById('no-deck');
							
							if (deckData && deckData.cards && deckData.cards.length > 0) {
								// Show deck info
								noDeck.style.display = 'none';
								deckInfo.style.display = 'block';
								
								// Update deck name and stats
								document.getElementById('deck-name').textContent = deckData.name || 'Current Deck';
								document.getElementById('deck-wins').textContent = (deckData.wins || 0) + 'W';
								document.getElementById('deck-losses').textContent = (deckData.losses || 0) + 'L';
								
								const total = (deckData.wins || 0) + (deckData.losses || 0);
								const winrate = total > 0 ? Math.round((deckData.wins || 0) / total * 100) : 0;
								document.getElementById('deck-winrate').textContent = winrate + '%';
								
								// Update card list
								cardList.innerHTML = '';
								deckData.cards.forEach(card => {
									const cardElement = document.createElement('div');
									cardElement.className = 'card-item ' + (card.remaining > 0 ? 'remaining' : 'used');
									cardElement.innerHTML = \`
										<span class="card-name">\${card.name}</span>
										<span class="card-count">\${card.remaining}/\${card.total}</span>
									\`;
									cardList.appendChild(cardElement);
								});
							} else {
								// No deck detected
								deckInfo.style.display = 'none';
								cardList.innerHTML = '';
								noDeck.style.display = 'block';
							}
						}

						// Expose functions globally so they can be called from main process
						window.updateScene = updateScene;
						window.updateDeckData = updateDeckData;
						window.toggleDecktracker = toggleDecktracker;
						
						// Initial status
						updateScene('Loading...', 'Connecting to MindVision...');

						// Initialize with mock data for testing
						setTimeout(() => {
							updateDeckData({
								name: 'Test Mage Deck',
								wins: 5,
								losses: 2,
								cards: [
									{ name: 'Fireball', total: 2, remaining: 1 },
									{ name: 'Frostbolt', total: 2, remaining: 2 },
									{ name: 'Arcane Intellect', total: 2, remaining: 0 },
									{ name: 'Polymorph', total: 1, remaining: 1 },
									{ name: 'Flamestrike', total: 1, remaining: 1 },
									{ name: 'Water Elemental', total: 2, remaining: 1 },
									{ name: 'Mana Wyrm', total: 2, remaining: 0 }
								]
							});
						}, 3000);
					</script>
				</body>
			</html>
		`;
	}

	/**
	 * Update the scene display in the overlay
	 */
	public updateSceneDisplay(scene: string | null, status?: string) {
		if (this.overlayWindow && this.overlayWindow.window) {
			try {
				// Execute JavaScript in the overlay window to update the scene
				this.overlayWindow.window.webContents.executeJavaScript(`
					if (window.updateScene) {
						window.updateScene('${(scene || 'Unknown').replace(/'/g, "\\'")}', '${(status || 'Connected').replace(/'/g, "\\'")}');
					}
				`);
			} catch (error) {
				console.error('❌ Error updating scene display:', error);
			}
		}
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
