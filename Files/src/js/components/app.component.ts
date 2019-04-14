import { Component, ChangeDetectionStrategy } from '@angular/core';

import { PackMonitor } from '../services/collection/pack-monitor.service';
import { IndexedDbService } from '../services/collection/indexed-db.service';
import { IndexedDbService as AchievementsDb } from '../services/achievement/indexed-db.service';
import { AchievementsMonitor } from '../services/achievement/achievements-monitor.service';
import { DebugService } from '../services/debug.service';
import { LogStatusService } from '../services/log-status.service';
import { HsPublicEventsListener } from '../services/hs-public-events-listener.service';
import { PackHistoryService } from '../services/collection/pack-history.service';
import { PackStatsService } from '../services/collection/pack-stats.service';
import { CollectionManager } from '../services/collection/collection-manager.service';
import { AchievementStatsService } from '../services/achievement/achievement-stats.service';
import { DevService } from '../services/dev.service';
import { AchievementsVideoCaptureService } from '../services/achievement/achievements-video-capture.service';
import { DeckParserService } from '../services/decktracker/deck-parser.service';
import { GameStateService } from '../services/decktracker/game-state.service';
import { SettingsCommunicationService } from '../services/settings/settings-communication.service';
import { MainWindowStoreService } from '../services/mainwindow/store/main-window-store.service';
import { CloseMainWindowEvent } from '../services/mainwindow/store/events/close-main-window-event';
import { ShowMainWindowEvent } from '../services/mainwindow/store/events/show-main-window-event';

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
export class AppComponent {

	private static readonly STATES = ['INIT', 'READY'];
	private static readonly LOADING_SCREEN_DURATION = 10000;

	private currentState = 'INIT';
	private loadingWindowId: string;

	constructor(
		private store: MainWindowStoreService,
		private packMonitor: PackMonitor,
		private packHistory: PackHistoryService,
		private debugService: DebugService,
		private dev: DevService, 
		private publicEventsListener: HsPublicEventsListener,
		private achievementsMonitor: AchievementsMonitor,
		private achievementsVideoCaptureService: AchievementsVideoCaptureService,
		private packStatsService: PackStatsService,
		private achievementStatsService: AchievementStatsService,
		private collectionDb: IndexedDbService,
		private collectionManager: CollectionManager,
		private achievementsDb: AchievementsDb,
		private deckParserService: DeckParserService,
		private gameStateService: GameStateService,
		private settingsCommunicationService: SettingsCommunicationService,
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

		console.log('app init starting');

		overwolf.settings.registerHotKey(
			"collection",
			(result) => {
				console.log('hotkey pressed', result)
				if (result.status === 'success') {
					overwolf.windows.obtainDeclaredWindow("CollectionWindow", (result) => {
						console.log('is CollectionWindow running?', result);
						if (result.window.isVisible) {
                            this.store.stateUpdater.next(new CloseMainWindowEvent());
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
		
		overwolf.games.onGameInfoUpdated.addListener((res: any) => {
			// console.log('updated game', res);
			if (this.exitGame(res)) {
				this.closeApp();
			}
			else if (this.gameRunning(res.gameInfo)) {
				this.showLoadingScreen();
			}
		});

		overwolf.windows.obtainDeclaredWindow("LoadingWindow", (result) => {
			this.loadingWindowId = result.window.id;
			// console.log('retrievd loadingwindow', result);
			overwolf.windows.restore(this.loadingWindowId, (result2) => {
				// console.log('loadingwindow restored', result2)
				overwolf.windows.hide(this.loadingWindowId);
				overwolf.games.getRunningGameInfo((res: any) => {
					// console.log('running game info', res);
					if (this.gameRunning(res)) {
						this.showLoadingScreen();
					}
				});
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
				})
				ga('send', 'event', 'toast', 'start-app');
			})
		});

		overwolf.windows.obtainDeclaredWindow("SettingsWindow", (result) => {
			overwolf.windows.restore(result.window.id, (result2) => {
				overwolf.windows.hide(result.window.id);
			});
		});
	}

	private showLoadingScreen() {
		// console.log('showing loading screen?', this.currentState, this.loadingWindowId);
		if (this.currentState == 'READY') {
			return;
		}

		overwolf.windows.restore(this.loadingWindowId, (result) => {
			this.closeWelcomeWindow();
			this.closeCollectionWindow();
			// console.log('final restore for loadingwindow done', result);
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
			// console.log('running game info', res);
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
		overwolf.windows.obtainDeclaredWindow("LoadingWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get LoadingWindow', result);
				return;
			}
			overwolf.windows.hide(result.window.id);
		});
	}

	private closeWelcomeWindow() {
		overwolf.windows.obtainDeclaredWindow("WelcomeWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get WelcomeWindow', result);
				return;
            }
            console.log('closing welcome window');
			overwolf.windows.hide(result.window.id);
		});
	}

	private closeCollectionWindow() {
		overwolf.windows.obtainDeclaredWindow("CollectionWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get CollectionWindow', result);
				return;
			}
			overwolf.windows.hide(result.window.id);
		});
	}

	private showWelcomePage() {
		overwolf.windows.obtainDeclaredWindow("WelcomeWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get WelcomeWindow', result);
				return;
			}
			// console.log('got welcome window', result);

			overwolf.windows.restore(result.window.id, (result) => {
				// console.log('WelcomeWindow is on?', result);
				this.closeLoadingScreen();
			})
		});
	}

	private showCollectionWindow() {
		// console.log('showing collection page');
		if (this.currentState != 'READY') {
			console.log('app not ready yet, cannot show collection window', this.currentState);
			return;
        }
        console.log('reading to show collection window');
		overwolf.windows.obtainDeclaredWindow("CollectionWindow", (result) => {
			if (result.status !== 'success') {
				console.warn('Could not get CollectionWindow', result);
				return;
			}
            // console.log('got collection window', result);
            console.log('sending new event', this.store);
            this.store.stateUpdater.next(new ShowMainWindowEvent());
            console.log('sent new event', this.store);
			overwolf.windows.restore(result.window.id, (result) => {
				// console.log('CollectionWindow is on?', result);
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

		// console.log("HS running");
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
