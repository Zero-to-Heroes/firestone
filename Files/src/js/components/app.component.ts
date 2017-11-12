import { Component } from '@angular/core';

import * as Raven from 'raven-js';

import { PackMonitor } from '../services/pack-monitor.service';
import { DebugService } from '../services/debug.service';
import { LogStatusService } from '../services/log-status.service';

const HEARTHSTONE_GAME_ID = 9898;

declare var overwolf: any;

@Component({
	selector: 'zh-app',
	styleUrls: [`../../css/component/app.component.scss`],
	template: `
		<div>
		</div>
	`,
})
// 7.1.1.17994
export class AppComponent {

	constructor(
		private packMonitor: PackMonitor,
		private debugService: DebugService,
		private logStatusService: LogStatusService) {

		// overwolf.settings.registerHotKey(
		// 	"collection",
		// 	(result) => {
		// 		console.log('hotkey pressed')
		// 		if (result.status === 'success') {
		// 			this.startApp(() => this.showCollectionWindow());
		// 		}
		// 		else {
		// 			console.log('error registering hotkey', result);
		// 		}
		// 	}
		// )

		this.startApp();

		overwolf.extensions.onAppLaunchTriggered.addListener((result) => {
			this.startApp(() => this.showWelcomePage());
		})
	}

	private startApp(showWhenStarted?: Function) {
		overwolf.games.getRunningGameInfo((res: any) => {
			if (res && res.isRunning && res.id && Math.floor(res.id / 10) === HEARTHSTONE_GAME_ID) {
				if (showWhenStarted) {
					showWhenStarted();
				}
			}
			else {
				this.showWelcomePage();
			}
		});
	}

	private showWelcomePage() {
		console.log('starting from desktop, showing welcome page');
		overwolf.windows.obtainDeclaredWindow("WelcomeWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get WelcomeWindow', result);
				return;
			}
			console.log('got welcome window', result);

			overwolf.windows.restore(result.window.id, (result) => {
				console.log('WelcomeWindow is on?', result);
			})
		});
	}

	private showCollectionWindow() {
		console.log('showing collection page');
		overwolf.windows.obtainDeclaredWindow("CollectionWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get CollectionWindow', result);
				return;
			}
			console.log('got collection window', result);

			overwolf.windows.restore(result.window.id, (result) => {
				console.log('CollectionWindow is on?', result);
			})
		});
	}

	private gameLaunched(gameInfoResult: any): boolean {
		if (!gameInfoResult) {
			console.log('No gameInfoResult, returning');
			return false;
		}

		if (!gameInfoResult.gameInfo) {
			console.log('No gameInfoResult.gameInfo, returning');
			return false;
		}

		// if (!gameInfoResult.runningChanged && !gameInfoResult.gameChanged) {
		// 	console.log('Running didnt change, returning');
		// 	return false;
		// }

		if (!gameInfoResult.gameInfo.isRunning) {
			console.log('Game not running, returning');
			return false;
		}

		// NOTE: we divide by 10 to get the game class id without it's sequence number
		if (Math.floor(gameInfoResult.gameInfo.id / 10) !== HEARTHSTONE_GAME_ID) {
			console.log('Not HS, returning');
			return false;
		}

		console.log("HS Launched");
		return true;
	}

	private gameRunning(gameInfo: any): boolean {

		if (!gameInfo) {
			return false;
		}

		if (!gameInfo.isRunning) {
			return false;
		}

		// NOTE: we divide by 10 to get the game class id without it's sequence number
		if (Math.floor(gameInfo.id / 10) !== HEARTHSTONE_GAME_ID) {
			return false;
		}

		console.log("HS running");
		return true;
	}
}
