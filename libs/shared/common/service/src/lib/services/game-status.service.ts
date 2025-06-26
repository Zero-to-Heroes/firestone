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

@Injectable()
export class GameStatusService extends AbstractFacadeService<GameStatusService> {
	public inGame$$: SubscriberAwareBehaviorSubject<boolean | null>;

	private startListeners: any[] = [];
	private exitListeners: any[] = [];

	private ow: OverwolfService;
	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'gameStatus', () => !!this.inGame$$);
	}

	protected override assignSubjects() {
		this.inGame$$ = this.mainInstance.inGame$$;
	}

	protected async init() {
		this.inGame$$ = new SubscriberAwareBehaviorSubject<boolean | null>(null);
		this.ow = AppInjector.get(OverwolfService);
		this.prefs = AppInjector.get(PreferencesService);

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

		// if (await this.ow.inGame()) {
		// 	this.inGame$$.next(true);
		// }
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
