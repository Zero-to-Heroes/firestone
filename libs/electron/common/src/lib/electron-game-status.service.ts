// Hearthstone game ID constant (avoiding circular dependency)
const HEARTHSTONE_GAME_ID = 9898;
import { BrowserWindow, ipcMain, ipcRenderer } from 'electron';
import { ElectronGameWindowService, GameWindowInfo } from './electron-game-window.service';

export interface GameInfoUpdatedEvent {
	gameInfo?: {
		id?: number;
		isRunning?: boolean;
		executionPath?: string;
	};
	gameChanged?: boolean;
	runningChanged?: boolean;
}

/**
 * Electron-specific implementation of game status functionality.
 * This service handles the game detection and status management in the main process,
 * and communicates with renderer processes via IPC.
 */
export class ElectronGameStatusService {
	private static instance: ElectronGameStatusService;
	private gameWindowService: ElectronGameWindowService;
	private gameInfoListeners: ((event: GameInfoUpdatedEvent) => void)[] = [];
	private isMainProcess: boolean;
	private currentGameRunning = false;

	private constructor() {
		this.isMainProcess = typeof ipcMain !== 'undefined';

		if (this.isMainProcess) {
			this.gameWindowService = ElectronGameWindowService.getInstance();
			this.setupMainProcessHandlers();
		} else {
			this.setupRendererProcessHandlers();
		}
	}

	public static getInstance(): ElectronGameStatusService {
		if (!ElectronGameStatusService.instance) {
			ElectronGameStatusService.instance = new ElectronGameStatusService();
		}
		return ElectronGameStatusService.instance;
	}

	private setupMainProcessHandlers(): void {
		// Handle IPC requests from renderer processes
		ipcMain.handle('electron-game-status-in-game', async () => {
			return this.inGameInternal();
		});

		ipcMain.handle('electron-game-status-get-running-game-info', async () => {
			return this.getRunningGameInfoInternal();
		});

		// Listen to game events from ElectronGameWindowService
		this.gameWindowService.onGameInfoChanged((gameInfo: GameWindowInfo | null) => {
			const wasRunning = this.currentGameRunning;
			const isRunning = this.isHearthstoneRunning(gameInfo);
			this.currentGameRunning = isRunning;

			const event: GameInfoUpdatedEvent = {
				gameInfo: gameInfo
					? {
							id: gameInfo.id,
							isRunning: gameInfo.isRunning,
							executionPath: gameInfo.executionPath,
						}
					: undefined,
				gameChanged: wasRunning !== isRunning,
				runningChanged: wasRunning !== isRunning,
			};

			// Only notify if there's actually a change
			if (event.gameChanged || event.runningChanged) {
				console.log('[ElectronGameStatusService] Game status changed:', {
					wasRunning,
					isRunning,
					gameInfo: event.gameInfo,
				});

				// Notify local listeners
				this.gameInfoListeners.forEach((callback) => callback(event));

				// Broadcast to all renderer processes
				// this.broadcastToRenderers('electron-game-info-updated', event);
			}
		});
	}

	private setupRendererProcessHandlers(): void {
		// Listen for broadcasts from main process
		if (ipcRenderer) {
			ipcRenderer.on('electron-game-info-updated', (_, event: GameInfoUpdatedEvent) => {
				this.gameInfoListeners.forEach((callback) => callback(event));
			});
		}
	}

	private broadcastToRenderers(channel: string, data: any): void {
		// Send to all renderer windows
		BrowserWindow.getAllWindows().forEach((window) => {
			if (!window.isDestroyed()) {
				window.webContents.send(channel, data);
			}
		});
	}

	private isHearthstoneRunning(gameInfo: GameWindowInfo | null): boolean {
		return !!(gameInfo?.isRunning && Math.floor((gameInfo?.id ?? 0) / 10) === HEARTHSTONE_GAME_ID);
	}

	public addGameInfoUpdatedListener(callback: (event: GameInfoUpdatedEvent) => void): void {
		this.gameInfoListeners.push(callback);
	}

	public async inGame(): Promise<boolean> {
		if (this.isMainProcess) {
			return this.inGameInternal();
		} else {
			// Delegate to main process via IPC
			return ipcRenderer.invoke('electron-game-status-in-game');
		}
	}

	// private async inGameInternal(): Promise<boolean> {
	// 	const gameInfo = this.gameWindowService.getCurrentGameInfo();
	// 	return this.isHearthstoneRunning(gameInfo);
	// }

	public exitGame(gameInfoResult: GameInfoUpdatedEvent): boolean {
		return (
			!gameInfoResult?.gameInfo?.isRunning &&
			Math.floor((gameInfoResult?.gameInfo?.id ?? 0) / 10) === HEARTHSTONE_GAME_ID
		);
	}

	public async getRunningGameInfo(): Promise<GameWindowInfo | null> {
		if (this.isMainProcess) {
			return this.getRunningGameInfoInternal();
		} else {
			// Delegate to main process via IPC
			return ipcRenderer.invoke('electron-game-status-get-running-game-info');
		}
	}

	private async getRunningGameInfoInternal(): Promise<GameWindowInfo | null> {
		return this.gameWindowService.getCurrentGameInfo();
	}
}
