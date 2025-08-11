import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	GameWindowInfo,
	HEARTHSTONE_GAME_ID,
	isMainProcess,
	OverwolfService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { PreferencesService } from './preferences.service';

@Injectable()
export class GameStatusService extends AbstractFacadeService<GameStatusService> {
	public inGame$$: SubscriberAwareBehaviorSubject<boolean | null>;

	private startListeners: any[] = [];
	private exitListeners: any[] = [];

	private prefs: PreferencesService;
	private ow: OverwolfService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'gameStatus', () => !!this.inGame$$);
	}

	protected override assignSubjects() {
		this.inGame$$ = this.mainInstance.inGame$$;
	}

	// This only executes in the main process (in case of electron), not in the renderer
	protected async init() {
		this.inGame$$ = new SubscriberAwareBehaviorSubject<boolean | null>(null);
		this.prefs = AppInjector.get(PreferencesService);

		console.debug('[game-status] isElectronContext', this.isElectronContext);

		// Setup Electron IPC handlers if we're in main process
		if (this.isElectronContext && isMainProcess()) {
			// Use eval to prevent bundler from trying to include electron in frontend builds
			const { ipcMain } = eval('require')('electron');
			if (typeof ipcMain !== 'undefined') {
				this.setupElectronMainProcessHandlers();
			}
		}

		// Load initial value
		this.inGame$$.onFirstSubscribe(async () => {
			const inGame = await this.inGameInternal();
			this.inGame$$.next(inGame);
		});

		// Listen to game status changes
		if (this.isElectronContext) {
			if (isMainProcess()) {
				// In main process, use eval require with relative path to prevent bundler issues
				const { ElectronGameWindowService } = eval('require')('../../libs/electron/common/src/index.js');
				const gameWindowService = ElectronGameWindowService.getInstance();
				gameWindowService.onGameInfoChanged((gameInfo: any) => {
					if (gameInfo?.isRunning && Math.floor((gameInfo?.id ?? 0) / 10) === HEARTHSTONE_GAME_ID) {
						console.debug('[game-status] game launched', gameInfo);
						this.inGame$$.next(true);
						this.startListeners.forEach((cb: any) => cb(gameInfo));
						this.updateExecutionPathInPrefs(gameInfo?.executionPath ?? '');
					}
				});
			}
			// Note: In renderer process, game info changes will come via IPC
		} else {
			this.ow = AppInjector.get(OverwolfService);
			this.ow.addGameInfoUpdatedListener(async (res) => {
				if (Math.floor((res?.gameInfo?.id ?? 0) / 10) === HEARTHSTONE_GAME_ID) {
					if (this.ow.exitGame(res)) {
						this.inGame$$.next(false);
						this.exitListeners.forEach((cb: any) => cb(res));
					} else if ((await this.ow.inGame()) && (res.gameChanged || res.runningChanged)) {
						this.inGame$$.next(true);
						console.debug('[game-status] game launched', res);
						this.startListeners.forEach((cb: any) => cb(res));
						this.updateExecutionPathInPrefs(res.gameInfo?.executionPath ?? '');
					}
				}
			});
		}

		const inGame = await this.inGameInternal();
		console.debug('[game-status] inGame at launch', inGame);
		this.inGame$$.next(inGame);

		const gameInfo = this.isElectronContext ? await this.getElectronGameInfo() : await this.ow.getRunningGameInfo();
		this.updateExecutionPathInPrefs(gameInfo?.executionPath);
	}

	// In renderer process
	protected override async createElectronProxy() {
		// In renderer process, create proxy subjects that communicate with main process via IPC
		this.inGame$$ = new SubscriberAwareBehaviorSubject<boolean | null>(null);
		this.prefs = AppInjector.get(PreferencesService);

		console.debug('[game-status] creating Electron proxy in renderer process');
		// Load initial value from main process via IPC
		this.inGame$$.onFirstSubscribe(async () => {
			const inGame = await this.inGameViaIPC();
			this.inGame$$.next(inGame);
		});

		// Listen for game status changes from main process
		const { ipcRenderer } = window.require('electron');
		if (ipcRenderer) {
			ipcRenderer.on('game-status-changed', (_, inGame: boolean | null) => {
				this.inGame$$.next(inGame);
			});
		}
	}

	private async getElectronGameInfo(): Promise<any> {
		if (isMainProcess()) {
			// In main process, use eval require with relative path to prevent bundler issues
			const { ElectronGameWindowService } = eval('require')('../../libs/electron/common/src/index.js');
			const gameWindowService = ElectronGameWindowService.getInstance();
			return gameWindowService.getCurrentGameInfo();
		} else {
			// In renderer process, use window.require
			const { ElectronGameWindowService } = window.require('@firestone/electron/common');
			const gameWindowService = ElectronGameWindowService.getInstance();
			return gameWindowService.getCurrentGameInfo();
		}
	}

	public async onGameStart(callback: any) {
		this.startListeners.push(callback);
		if (await this.inGame()) {
			callback();
		}
	}

	public onGameExit(callback: any) {
		this.exitListeners.push(callback);
	}

	public async inGame(): Promise<boolean | null> {
		await this.isReady();
		return this.inGame$$.getValueWithInit();
	}

	private async inGameInternal(): Promise<boolean> {
		if (this.isElectronContext) {
			return this.getElectronInGame();
		} else if (this.ow) {
			return this.ow.inGame();
		}
		return false;
	}

	// Here we are always in the main process
	private async getElectronInGame(): Promise<boolean> {
		if (isMainProcess()) {
			// In main process, use eval require with relative path to prevent bundler issues
			const { ElectronGameWindowService } = eval('require')('../../libs/electron/common/src/index.js');
			const gameWindowService = ElectronGameWindowService.getInstance();
			const gameInfo = gameWindowService.getCurrentGameInfo();
			return this.isHearthstoneRunning(gameInfo);
		} else {
			// In renderer process, use window.require
			const { ElectronGameWindowService } = window.require('@firestone/electron/common');
			const gameWindowService = ElectronGameWindowService.getInstance();
			const gameInfo = gameWindowService.getCurrentGameInfo();
			return this.isHearthstoneRunning(gameInfo);
		}
	}

	private isHearthstoneRunning(gameInfo: GameWindowInfo | null): boolean {
		return !!(gameInfo?.isRunning && Math.floor((gameInfo?.id ?? 0) / 10) === HEARTHSTONE_GAME_ID);
	}

	private async updateExecutionPathInPrefs(executionPath: string | null | undefined) {
		if (!executionPath?.length) {
			return;
		}

		let gameLocation = executionPath.split('Hearthstone.exe')[0]?.replaceAll('/', '\\');
		if (gameLocation?.endsWith('\\')) {
			gameLocation = gameLocation.substring(0, gameLocation.length - 1);
		}
		const prefs = await this.prefs.getPreferences();
		console.debug('[game-status] updating install path?', prefs.gameInstallPath, gameLocation);
		if (prefs.gameInstallPath !== gameLocation) {
			const newPrefs = {
				...prefs,
				gameInstallPath: gameLocation,
			};
			await this.prefs.savePreferences(newPrefs);
			console.debug('[game-status] updated install path?', newPrefs.gameInstallPath);
		}
	}

	private async setupElectronMainProcessHandlers() {
		// Use eval to prevent bundler from trying to include electron in frontend builds
		const { ipcMain } = eval('require')('electron');
		// Handle IPC requests from renderer processes
		ipcMain.handle('game-status-in-game', async () => {
			return this.inGame$$.getValueWithInit();
		});
		// Broadcast game status changes to all renderer processes
		const originalNext = this.inGame$$.next.bind(this.inGame$$);
		this.inGame$$.next = (value: boolean | null) => {
			originalNext(value);
			this.broadcastToRenderers('game-status-changed', value);
		};
	}

	private async inGameViaIPC(): Promise<boolean | null> {
		const { ipcRenderer } = window.require('electron');
		if (ipcRenderer) {
			return ipcRenderer.invoke('game-status-in-game');
		}
		return null;
	}

	private broadcastToRenderers(channel: string, data: any): void {
		// Import BrowserWindow dynamically to avoid issues in renderer process
		try {
			// Use eval to prevent bundler from trying to include electron in frontend builds
			const { BrowserWindow } = eval('require')('electron');
			BrowserWindow.getAllWindows().forEach((window: any) => {
				if (!window.isDestroyed()) {
					window.webContents.send(channel, data);
				}
			});
		} catch (error) {
			console.debug('[game-status] Could not broadcast to renderers:', error);
		}
	}
}
