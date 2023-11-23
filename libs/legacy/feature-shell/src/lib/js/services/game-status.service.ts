import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	OverwolfService,
	WindowManagerService,
} from '@firestone/shared/framework/core';

@Injectable()
export class GameStatusService extends AbstractFacadeService<GameStatusService> {
	public inGame$$: SubscriberAwareBehaviorSubject<boolean>;

	private startListeners = [];
	private exitListeners = [];

	private ow: OverwolfService;
	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'gameStatus', () => !!this.inGame$$);
	}

	protected override assignSubjects() {
		this.inGame$$ = this.mainInstance.inGame$$;
	}

	protected async init() {
		this.inGame$$ = new SubscriberAwareBehaviorSubject<boolean>(null);
		this.ow = AppInjector.get(OverwolfService);
		this.prefs = AppInjector.get(PreferencesService);

		this.inGame$$.onFirstSubscribe(async () => {
			const inGame = await this.ow.inGame();
			this.inGame$$.next(inGame);
		});

		this.ow.addGameInfoUpdatedListener(async (res) => {
			if (this.ow.exitGame(res)) {
				this.inGame$$.next(false);
				this.exitListeners.forEach((cb) => cb(res));
			} else if ((await this.ow.inGame()) && (res.gameChanged || res.runningChanged)) {
				this.inGame$$.next(true);
				console.debug('[game-status] game launched', res);
				this.startListeners.forEach((cb) => cb(res));
				this.updateExecutionPathInPrefs(res.gameInfo?.executionPath);
			}
		});

		const gameInfo = await this.ow.getRunningGameInfo();
		this.updateExecutionPathInPrefs(gameInfo?.executionPath);

		// if (await this.ow.inGame()) {
		// 	this.inGame$$.next(true);
		// }
	}

	public async onGameStart(callback) {
		this.startListeners.push(callback);
		if (await this.inGame()) {
			callback();
		}
	}

	public onGameExit(callback) {
		this.exitListeners.push(callback);
	}

	public async inGame(): Promise<boolean> {
		await this.isReady();
		return this.inGame$$.getValueWithInit();
	}

	private async updateExecutionPathInPrefs(executionPath: string) {
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
