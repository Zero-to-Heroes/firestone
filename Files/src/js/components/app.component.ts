import { Component, ChangeDetectionStrategy } from '@angular/core';

import { PackMonitor } from '../services/collection/pack-monitor.service';
import { IndexedDbService } from '../services/collection/indexed-db.service';
import { IndexedDbService as AchievementsDb } from '../services/achievement/indexed-db.service';
import { AchievementsMonitor } from '../services/achievement/achievements-monitor.service';
import { DebugService } from '../services/debug.service';
import { LogStatusService } from '../services/log-status.service';
import { HsPublicEventsListener } from '../services/hs-public-events-listener.service';
import { Events } from '../services/events.service';
import { PackHistoryService } from '../services/collection/pack-history.service';
import { PackStatsService } from '../services/collection/pack-stats.service';

const HEARTHSTONE_GAME_ID = 9898;

declare var overwolf: any;
declare var ga: any;

@Component({
	selector: 'app-root',
	styleUrls: [`../../css/component/app.component.scss`],
	template: `
		<div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
// 7.1.1.17994
export class AppComponent {

	private static readonly STATES = ['INIT', 'READY'];
	private static readonly LOADING_SCREEN_DURATION = 10000;

	private currentState = 'INIT';
	private loadingWindowId: string;

	constructor(
		private packMonitor: PackMonitor,
		private packHistory: PackHistoryService,
		private events: Events,
		private debugService: DebugService,
		private publicEventsListener: HsPublicEventsListener,
		private achievementsMonitor: AchievementsMonitor,
		private packStatsService: PackStatsService,
		private collectionDb: IndexedDbService,
		private achievementsDb: AchievementsDb,
		private logStatusService: LogStatusService) {

		this.init();
	}

	private init() {
		// Wait until DB has properly been upgraded when needed
		if (!this.collectionDb.dbInit) {
			setTimeout(() => {
				this.init();
			}, 200);
			return;
		}
		if (!this.achievementsDb.dbInit) {
			setTimeout(() => {
				this.init();
			}, 200);
			return;
		}

		console.log('real init starting');

		overwolf.settings.registerHotKey(
			"collection",
			(result) => {
				console.log('hotkey pressed', result)
				if (result.status === 'success') {
					overwolf.windows.obtainDeclaredWindow("CollectionWindow", (result) => {
						console.log('is CollectionWindow running?', result);
						if (result.window.isVisible) {
							overwolf.windows.hide(result.window.id);
						}
						else {
							this.closeWelcomeWindow();
							this.startApp(() => this.showCollectionWindow());
						}
					});
				}
				else {
					console.log('could not trigger hotkey', result, this.currentState);
				}
			}
		)

		overwolf.windows.obtainDeclaredWindow("LoadingWindow", (result) => {
			this.loadingWindowId = result.window.id;
			console.log('retrievd loadingwindow', result);
			overwolf.windows.restore(this.loadingWindowId, (result2) => {
				console.log('loadingwindow restored', result2)
				overwolf.windows.hide(this.loadingWindowId);
				overwolf.games.onGameInfoUpdated.addListener((res: any) => {
					console.log('updated game', res);
					if (this.exitGame(res)) {
						this.closeApp();
					}
					else if (this.gameRunning(res.gameInfo)) {
						this.showLoadingScreen();
					}
				});
				overwolf.games.getRunningGameInfo((res: any) => {
					console.log('running game info', res);
					if (this.gameRunning(res)) {
						this.showLoadingScreen();
					}
				});
			});


			overwolf.windows.obtainDeclaredWindow("CollectionWindow", (result) => {
				if (result.status !== 'success') {
					console.warn('Could not get CollectionWindow', result);
					return;
				}
				overwolf.windows.restore(result.window.id, (result2) => {
					overwolf.windows.hide(result.window.id);

					this.startApp();

					overwolf.extensions.onAppLaunchTriggered.addListener((result) => {
						this.startApp(() => this.showCollectionWindow());
						// this.startApp(() => this.showWelcomePage());
					})

					ga('send', 'event', 'toast', 'start-app');
				})
			});
		});

	}

	private showLoadingScreen() {
		console.log('showing loading screen?', this.currentState, this.loadingWindowId);
		if (this.currentState == 'READY') {
			return;
		}

		overwolf.windows.restore(this.loadingWindowId, (result) => {
			this.closeWelcomeWindow();
			this.closeCollectionWindow();
			console.log('final restore for loadingwindow done', result);
			setTimeout(() => {
				this.notifyAbilitiesReady();
			},
			AppComponent.LOADING_SCREEN_DURATION);
		});
	}

	private notifyAbilitiesReady() {
		this.currentState = 'READY';
		overwolf.windows.sendMessage(this.loadingWindowId, 'ready', 'ready', (result) => {
		});
	}

	private startApp(showWhenStarted?: Function) {
		overwolf.games.getRunningGameInfo((res: any) => {
			console.log('running game info', res);
			if (res && res.isRunning && res.id && Math.floor(res.id / 10) === HEARTHSTONE_GAME_ID) {
				if (showWhenStarted && this.currentState == 'READY') {
					showWhenStarted();
				}
			}
			else {
				this.showWelcomePage();
			}
		});
	}

	private closeLoadingScreen() {
		console.log('starting from desktop, showing welcome page');
		overwolf.windows.obtainDeclaredWindow("LoadingWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get LoadingWindow', result);
				return;
			}
			overwolf.windows.hide(result.window.id);
		});
	}

	private closeWelcomeWindow() {
		console.log('starting from desktop, showing welcome page');
		overwolf.windows.obtainDeclaredWindow("WelcomeWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get WelcomeWindow', result);
				return;
			}
			overwolf.windows.hide(result.window.id);
		});
	}

	private closeCollectionWindow() {
		console.log('starting from desktop, showing welcome page');
		overwolf.windows.obtainDeclaredWindow("CollectionWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get CollectionWindow', result);
				return;
			}
			overwolf.windows.hide(result.window.id);
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
				this.closeLoadingScreen();
			})
		});
	}

	private showCollectionWindow() {
		console.log('showing collection page');
		if (this.currentState != 'READY') {
			console.log('app not ready yet, cannot show collection window', this.currentState);
			return;
		}
		overwolf.windows.obtainDeclaredWindow("CollectionWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get CollectionWindow', result);
				return;
			}
			console.log('got collection window', result);

			overwolf.windows.restore(result.window.id, (result) => {
				console.log('CollectionWindow is on?', result);
				this.closeLoadingScreen();
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

	private exitGame(gameInfoResult: any): boolean {
		return (!gameInfoResult || !gameInfoResult.gameInfo || !gameInfoResult.gameInfo.isRunning);
	}

	private closeApp() {
		overwolf.windows.getCurrentWindow((result) => {
			if (result.status === "success") {
				console.log('closing');
				overwolf.windows.close(result.window.id);
			}
		});
	}
}
