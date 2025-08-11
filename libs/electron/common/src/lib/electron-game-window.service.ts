import { GameWindowInfo } from '@firestone/shared/framework/core';
import { ipcMain } from 'electron';

// Global key for storing the singleton across different module loading contexts
const GLOBAL_SINGLETON_KEY = '__FIRESTONE_ELECTRON_GAME_WINDOW_SERVICE__';

export class ElectronGameWindowService {
	private currentGameInfo: GameWindowInfo | null = null;
	private overlayService: any; // Will be injected from the app
	private gameInfoChangeListeners: ((gameInfo: GameWindowInfo | null) => void)[] = [];
	private gameExitListeners: ((gameInfo: GameWindowInfo | null) => void)[] = [];
	private gameFocusListeners: ((focused: boolean) => void)[] = [];

	private constructor() {
		this.setupIpcHandlers();
	}

	public static getInstance(): ElectronGameWindowService {
		// Use global object to store singleton across different module loading contexts
		// This works in both Node.js (global) and browser (window) environments
		const globalObj = (typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}) as any;

		if (!globalObj[GLOBAL_SINGLETON_KEY]) {
			globalObj[GLOBAL_SINGLETON_KEY] = new ElectronGameWindowService();
		}
		return globalObj[GLOBAL_SINGLETON_KEY];
	}

	/**
	 * Initialize the service with the overlay service dependency
	 */
	public initialize(overlayService: any): void {
		this.overlayService = overlayService;
		this.listenToGameEvents();
	}

	/**
	 * Get current game info (for use in main process)
	 */
	public getCurrentGameInfo(): GameWindowInfo | null {
		return this.currentGameInfo;
	}

	public onGameInfoChanged(callback: (gameInfo: GameWindowInfo | null) => void): void {
		this.gameInfoChangeListeners.push(callback);
	}

	public onGameExit(callback: (gameInfo: GameWindowInfo | null) => void): void {
		this.gameExitListeners.push(callback);
	}

	public onGameFocusChanged(callback: (focused: boolean) => void): void {
		this.gameFocusListeners.push(callback);
	}

	private notifyGameInfoChanged(): void {
		this.gameInfoChangeListeners.forEach((callback) => callback(this.currentGameInfo));
	}

	private notifyGameExit(gameInfo: GameWindowInfo | null): void {
		this.gameExitListeners.forEach((callback) => callback(gameInfo));
	}

	private notifyGameFocusChanged(focused: boolean): void {
		this.gameFocusListeners.forEach((callback) => callback(focused));
	}

	/**
	 * Setup IPC handlers for renderer processes
	 */
	private setupIpcHandlers(): void {
		// Handle requests for game info from renderer processes
		ipcMain.handle('get-running-game-info', async () => {
			// console.log('[ElectronGameWindowService] IPC request for game info:', this.currentGameInfo);
			return this.currentGameInfo;
		});

		console.log('[ElectronGameWindowService] IPC handlers registered');
	}

	/**
	 * Listen to game events from overlay service and update stored info
	 */
	private listenToGameEvents(): void {
		if (!this.overlayService) {
			console.warn('[ElectronGameWindowService] No overlay service provided, cannot listen to game events');
			return;
		}

		// Wait for overlay service to be ready
		this.overlayService.on('ready', () => {
			console.log('[ElectronGameWindowService] Overlay service ready, setting up game event listeners');
			this.setupGameEventListeners();
		});
	}

	private setupGameEventListeners(): void {
		const overlayApi = this.overlayService.overlayApi;
		if (!overlayApi) {
			console.warn('[ElectronGameWindowService] No overlay API available');
			return;
		}

		// Listen for game launches
		overlayApi.on('game-launched', (event: any, gameInfo: any) => {
			if (Math.round(gameInfo.id / 10) === 9898) {
				// Hearthstone
				console.log('[ElectronGameWindowService] Hearthstone launched, updating game info');
				this.updateGameInfo(gameInfo);
			}
		});

		// Listen for game exit
		overlayApi.on('game-exit', (gameInfo: any, wasInjected: boolean) => {
			if (Math.round(gameInfo.id / 10) === 9898) {
				// Hearthstone
				console.log('[ElectronGameWindowService] Hearthstone exited, wasInjected:', wasInjected);
				const previousGameInfo = this.currentGameInfo;
				this.currentGameInfo = null;
				this.notifyGameExit(previousGameInfo);
			}
		});

		// Listen for game focus changes
		overlayApi.on('game-focus-changed', (window: any, game: any, focus: boolean) => {
			if (game.classId === 9898) {
				// Hearthstone
				console.log('[ElectronGameWindowService] Hearthstone focus changed:', focus, game.name);
				this.updateGameInfoFromActiveGame();
				this.notifyGameFocusChanged(focus);
			}
		});

		// Listen for game window changes
		overlayApi.on('game-window-changed', (window: any, game: any, reason: any) => {
			if (game.classId === 9898) {
				// Hearthstone
				console.log('[ElectronGameWindowService] Hearthstone window changed:', reason, game.name);
				this.updateGameInfoFromActiveGame();
			}
		});

		console.log('[ElectronGameWindowService] Game event listeners setup complete');
	}

	/**
	 * Update stored game info from game launch event
	 * Note: We don't notify listeners here because we only have placeholder dimensions (1920x1080).
	 * The actual dimensions will come from updateGameInfoFromActiveGame() when game-window-changed fires.
	 */
	private updateGameInfo(gameInfo: any): void {
		try {
			this.currentGameInfo = {
				success: true,
				isInFocus: true, // Will be updated by focus events
				gameIsInFocus: true,
				isRunning: true,
				title: gameInfo.name || 'Hearthstone',
				displayName: gameInfo.name || 'Hearthstone: Heroes of Warcraft',
				shortTitle: 'Hearthstone',
				id: gameInfo.id,
				classId: gameInfo.classId || 9898,
				width: 1920, // Placeholder - will be updated by window events
				height: 1080,
				logicalWidth: 1920,
				logicalHeight: 1080,
				executionPath: gameInfo.processInfo?.fullPath || '',
				windowHandle: { value: gameInfo.processInfo?.window_handle || 0 },
				monitorHandle: { value: 0 },
				processId: gameInfo.processInfo?.pid || 0,
			};

			console.log(
				'[ElectronGameWindowService] Game info updated from launch event (placeholder dimensions, waiting for actual size)',
			);

			// Don't notify listeners here - we only have placeholder dimensions (1920x1080)
			// The actual dimensions will come from updateGameInfoFromActiveGame()
			// which is called on game-focus-changed and game-window-changed events
		} catch (error) {
			console.error('[ElectronGameWindowService] Error updating game info from launch event:', error);
		}
	}

	/**
	 * Update stored game info from active game (with window dimensions)
	 */
	private updateGameInfoFromActiveGame(): void {
		try {
			const activeGame = this.overlayService.overlayApi?.getActiveGameInfo();
			console.log('[ElectronGameWindowService] Active game info:', activeGame?.gameWindowInfo?.size);
			if (!activeGame) {
				console.log('[ElectronGameWindowService] No active game info available');
				return;
			}

			// Extract window dimensions
			let gameWidth = 1920;
			let gameHeight = 1080;

			if (activeGame.gameWindowInfo?.size) {
				gameWidth = activeGame.gameWindowInfo.size.width;
				gameHeight = activeGame.gameWindowInfo.size.height;
			} else {
				const gameAny = activeGame as any;
				if (gameAny.size) {
					gameWidth = gameAny.size.width;
					gameHeight = gameAny.size.height;
				} else if (gameAny.width && gameAny.height) {
					gameWidth = gameAny.width;
					gameHeight = gameAny.height;
				}
			}

			// Update existing game info or create new one
			if (this.currentGameInfo) {
				this.currentGameInfo.width = gameWidth;
				this.currentGameInfo.height = gameHeight;
				this.currentGameInfo.logicalWidth = gameWidth;
				this.currentGameInfo.logicalHeight = gameHeight;
				this.currentGameInfo.isInFocus = activeGame.gameWindowInfo?.focused || false;
				this.currentGameInfo.gameIsInFocus = activeGame.gameWindowInfo?.focused || false;
			} else {
				// Create new game info if none exists
				this.currentGameInfo = {
					success: true,
					isInFocus: activeGame.gameWindowInfo?.focused || false,
					gameIsInFocus: activeGame.gameWindowInfo?.focused || false,
					isRunning: true,
					title: 'Hearthstone',
					displayName: 'Hearthstone: Heroes of Warcraft',
					shortTitle: 'Hearthstone',
					id: activeGame.gameInfo?.id || 98981,
					classId: activeGame.gameInfo?.classId || 9898,
					width: gameWidth,
					height: gameHeight,
					logicalWidth: gameWidth,
					logicalHeight: gameHeight,
					executionPath: activeGame.gameInfo?.processInfo?.fullPath || '',
					windowHandle: { value: activeGame.gameWindowInfo?.nativeHandle || 0 },
					monitorHandle: { value: 0 },
					processId: activeGame.gameInfo?.processInfo?.pid || 0,
				};
			}

			// console.log('[ElectronGameWindowService] Game info updated from active game:', {
			// 	dimensions: `${gameWidth}x${gameHeight}`,
			// 	focused: this.currentGameInfo.isInFocus,
			// });

			// Notify listeners of the change
			this.notifyGameInfoChanged();
		} catch (error) {
			console.error('[ElectronGameWindowService] Error updating game info from active game:', error);
		}
	}
}
