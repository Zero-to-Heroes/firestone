import { Injectable } from '@angular/core';
import { ElectronGameWindowService, GameWindowInfo } from '@firestone/electron/common';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	HEARTHSTONE_GAME_ID,
	OverwolfService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { overwolf } from '@overwolf/ow-electron';
import { app as electronApp } from 'electron';
import { PreferencesService } from './preferences.service';

// For Electron context detection
declare const window: any;

const app = electronApp as overwolf.OverwolfApp;

@Injectable()
export class GameStatusService extends AbstractFacadeService<GameStatusService> {
	public inGame$$: SubscriberAwareBehaviorSubject<boolean | null>;

	private startListeners: any[] = [];
	private exitListeners: any[] = [];

	private prefs: PreferencesService;
	private ow: OverwolfService;
	private gameWindowService: ElectronGameWindowService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'gameStatus', () => !!this.inGame$$);
	}

	protected override assignSubjects() {
		this.inGame$$ = this.mainInstance.inGame$$;
	}

	protected async init() {
		this.inGame$$ = new SubscriberAwareBehaviorSubject<boolean | null>(null);
		this.prefs = AppInjector.get(PreferencesService);

		console.debug('[game-status] isElectronContext', this.isElectronContext);

		// Load initial value
		this.inGame$$.onFirstSubscribe(async () => {
			const inGame = await this.inGameInternal();
			this.inGame$$.next(inGame);
		});

		// Listen to game status changes
		if (this.isElectronContext) {
			this.gameWindowService = ElectronGameWindowService.getInstance();
			this.gameWindowService.onGameInfoChanged((gameInfo: GameWindowInfo | null) => {
				if (gameInfo?.isRunning && Math.floor((gameInfo?.id ?? 0) / 10) === HEARTHSTONE_GAME_ID) {
					this.inGame$$.next(true);
					this.startListeners.forEach((cb: any) => cb(gameInfo));
					this.updateExecutionPathInPrefs(gameInfo?.executionPath ?? '');
				}
			});
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

		const gameInfo = this.isElectronContext ? await this.getElectronGameInfo() : await this.ow.getRunningGameInfo();
		this.updateExecutionPathInPrefs(gameInfo?.executionPath);
	}

	private async getElectronGameInfo(): Promise<any> {
		return this.gameWindowService.getCurrentGameInfo();
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
		return this.inGameInternal();
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
		const gameInfo = this.gameWindowService.getCurrentGameInfo();
		return this.isHearthstoneRunning(gameInfo);
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
}
