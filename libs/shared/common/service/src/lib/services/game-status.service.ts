import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	HEARTHSTONE_GAME_ID,
	OverwolfService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { PreferencesService } from './preferences.service';

// For Electron context detection
declare const window: any;

@Injectable()
export class GameStatusService extends AbstractFacadeService<GameStatusService> {
	public inGame$$: SubscriberAwareBehaviorSubject<boolean | null>;

	private startListeners: any[] = [];
	private exitListeners: any[] = [];

	private ow: OverwolfService;
	private prefs: PreferencesService;
	private isElectronContext: boolean;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'gameStatus', () => !!this.inGame$$);
	}

	protected override assignSubjects() {
		this.inGame$$ = this.mainInstance.inGame$$;
	}

	protected async init() {
		this.inGame$$ = new SubscriberAwareBehaviorSubject<boolean | null>(null);
		this.prefs = AppInjector.get(PreferencesService);

		// Detect if we're in electron context
		this.isElectronContext =
			(typeof window !== 'undefined' && (window as any).electronAPI !== undefined) ||
			(typeof process !== 'undefined' && process.versions?.electron !== undefined);

		if (this.isElectronContext) {
			await this.initElectronMode();
		} else {
			await this.initOverwolfMode();
		}
	}

	private async initElectronMode() {
		console.debug('[game-status] Initializing in Electron mode');

		// Use IPC directly for electron communication
		this.inGame$$.onFirstSubscribe(async () => {
			const inGame = await this.getElectronInGame();
			this.inGame$$.next(inGame);
		});

		// Listen for electron game status updates via IPC
		if (typeof window !== 'undefined' && window.require) {
			try {
				const { ipcRenderer } = window.require('electron');
				ipcRenderer.on('electron-game-info-updated', (_, res: any) => {
					if (Math.floor((res?.gameInfo?.id ?? 0) / 10) === HEARTHSTONE_GAME_ID) {
						if (!res?.gameInfo?.isRunning) {
							this.inGame$$.next(false);
							this.exitListeners.forEach((cb: any) => cb(res));
						} else if (res.gameChanged || res.runningChanged) {
							this.inGame$$.next(true);
							console.debug('[game-status] game launched (electron)', res);
							this.startListeners.forEach((cb: any) => cb(res));
							this.updateExecutionPathInPrefs(res.gameInfo?.executionPath ?? '');
						}
					}
				});
			} catch (e) {
				console.warn('[game-status] Could not set up IPC listener:', e);
			}
		}

		const gameInfo = await this.getElectronGameInfo();
		this.updateExecutionPathInPrefs(gameInfo?.executionPath);
	}

	private async getElectronInGame(): Promise<boolean> {
		if (typeof window !== 'undefined' && window.electronAPI?.getRunningGameInfo) {
			const gameInfo = await window.electronAPI.getRunningGameInfo();
			return gameInfo?.isRunning && Math.floor((gameInfo?.id ?? 0) / 10) === HEARTHSTONE_GAME_ID;
		} else if (typeof window !== 'undefined' && window.require) {
			try {
				const { ipcRenderer } = window.require('electron');
				return await ipcRenderer.invoke('electron-game-status-in-game');
			} catch (e) {
				console.warn('[game-status] Could not get game status via IPC:', e);
			}
		}
		return false;
	}

	private async getElectronGameInfo(): Promise<any> {
		if (typeof window !== 'undefined' && window.electronAPI?.getRunningGameInfo) {
			return await window.electronAPI.getRunningGameInfo();
		} else if (typeof window !== 'undefined' && window.require) {
			try {
				const { ipcRenderer } = window.require('electron');
				return await ipcRenderer.invoke('electron-game-status-get-running-game-info');
			} catch (e) {
				console.warn('[game-status] Could not get game info via IPC:', e);
			}
		}
		return null;
	}

	private async initOverwolfMode() {
		console.debug('[game-status] Initializing in Overwolf mode');
		this.ow = AppInjector.get(OverwolfService);

		this.inGame$$.onFirstSubscribe(async () => {
			const inGame = await this.ow.inGame();
			this.inGame$$.next(inGame);
		});

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

		const gameInfo = await this.ow.getRunningGameInfo();
		this.updateExecutionPathInPrefs(gameInfo?.executionPath);
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

		// For direct queries, we can also check the underlying service
		if (this.isElectronContext) {
			return this.getElectronInGame();
		} else if (this.ow) {
			return this.ow.inGame();
		}

		return this.inGame$$.getValueWithInit();
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
}
