import { Injectable } from '@angular/core';
import { PreferencesService } from '@legacy-import/src/lib/js/services/preferences.service';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class GameStatusService {
	private startListeners = [];
	private exitListeners = [];

	constructor(private readonly ow: OverwolfService, private readonly prefs: PreferencesService) {
		this.init();
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
		return this.ow.inGame();
	}

	private async init() {
		this.ow.addGameInfoUpdatedListener(async (res) => {
			if (this.ow.exitGame(res)) {
				this.exitListeners.forEach((cb) => cb(res));
			} else if ((await this.ow.inGame()) && (res.gameChanged || res.runningChanged)) {
				console.debug('[game-status] game launched', res);
				this.startListeners.forEach((cb) => cb(res));
				this.updateExecutionPathInPrefs(res.gameInfo?.executionPath);
			}
		});

		const gameInfo = await this.ow.getRunningGameInfo();
		this.updateExecutionPathInPrefs(gameInfo?.executionPath);
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
