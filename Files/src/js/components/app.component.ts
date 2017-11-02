import { Component } from '@angular/core';

import * as Raven from 'raven-js';

import { OwNotificationsService } from '../services/notifications.service';
import { PackMonitor } from '../services/pack-monitor.service';

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
		private notificationService: OwNotificationsService) {
		// overwolf.settings.registerHotKey(
		// 	"test_screenshot",
		// 	(result) => {
		// 		if (result.status === 'success') {
		// 			console.log('taking screenshot', result);
		// 			this.testScreenshot();
		// 		}
		// 		else {
		// 			console.log('error registering hotkey', result);
		// 		}
		// 	}
		// )

		this.startApp();

		overwolf.extensions.onAppLaunchTriggered.addListener((result) => {
			this.startApp();
		})
	}

	// private testScreenshot() {
	// 	let i = 4;
	// 	overwolf.media.getScreenshotUrl(
	// 		{
	// 			roundAwayFromZero : "true",
	// 			crop: this.getBoxForCard(i)
	// 		},
	// 		(result) => {
	// 			if (result.status !== 'success') {
	// 				console.log('[WARN] Could not take screenshot', result);
	// 			}
	// 			console.log('Part: Screenshot', result.url);
	// 			this.compare(result.url, 'unrevealed_card.JPG', (data) => {
	// 				console.log('screenshot match?', data);
	// 				if (data.rawMisMatchPercentage > 5) {
	// 					overwolf.media.getScreenshotUrl(
	// 						{
	// 							roundAwayFromZero : "true",
	// 							crop: this.getBoxForCardZoom(i)
	// 						},
	// 						(result) => {
	// 							if (result.status !== 'success') {
	// 								console.log('[WARN] Could not take screenshot', result);
	// 							}
	// 							console.log('Part: Screenshot zoom', result.url);
	// 							this.compare(result.url, 'unrevealed_card_zoom.JPG', (data) => {
	// 								console.log('screenshot match?', data);
	// 								if (data.rawMisMatchPercentage > 5) {
	// 									console.log('no match');
	// 								}
	// 								else {
	// 									console.log('match');
	// 								}
	// 							});
	// 						}
	// 					);
	// 				}
	// 				else {
	// 					console.log('match');
	// 				}
	// 			});
	// 		}
	// 	);
	// }

	private startApp() {
		overwolf.games.getRunningGameInfo((res: any) => {
			if (res && res.isRunning && res.id && Math.floor(res.id / 10) === HEARTHSTONE_GAME_ID) {
				this.createAppRunningToast();
			}
			else {
				// Show the welcome page
				this.showWelcomePage();

				// Show a toast when the game starts
				console.log('listeners?', overwolf.games.onGameInfoUpdated);
				let callback = (res2: any) => {
					if (this.gameLaunched(res2)) {
						this.createAppRunningToast();
						overwolf.games.onGameInfoUpdated.removeListener(callback);
					}
				};
				overwolf.games.onGameInfoUpdated.addListener(callback);
			}
		});
	}

	private createAppRunningToast() {
		console.log('sending welcome notification');
		this.notificationService.html('<div class="message-container"><img src="/IconStore.png"><div class="message">HS Collection Companion is running and monitoring your card packs</div></div>');
	}

	private showWelcomePage() {
		console.log('starting from desktop, showing welcome page');
		overwolf.windows.obtainDeclaredWindow("WelcomeWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get WelcomeWindow', result);
			}
			console.log('got welcome window', result);
			// this.windowId = result.window.id;

			overwolf.windows.restore(result.window.id, (result) => {
				console.log('WelcomeWindow is on?', result);
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
