import { Injectable } from '@angular/core';
import { PackMonitor } from './collection/pack-monitor.service';
import { PackHistoryService } from './collection/pack-history.service';
import { HsPublicEventsListener } from './hs-public-events-listener.service';
import { AchievementsMonitor } from './achievement/achievements-monitor.service';
import { AchievementsVideoCaptureService } from './achievement/achievements-video-capture.service';
import { PackStatsService } from './collection/pack-stats.service';
import { AchievementStatsService } from './achievement/achievement-stats.service';
import { CollectionManager } from './collection/collection-manager.service';
import { DeckParserService } from './decktracker/deck-parser.service';
import { GameStateService } from './decktracker/game-state.service';
import { LogStatusService } from './log-status.service';
import { SettingsCommunicationService } from './settings/settings-communication.service';
import { MainWindowStoreService } from './mainwindow/store/main-window-store.service';
import { DebugService } from './debug.service';
import { DevService } from './dev.service';
import { IndexedDbService } from './collection/indexed-db.service';
import { IndexedDbService as AchievementsDb } from './achievement/indexed-db.service';
import { CloseMainWindowEvent } from './mainwindow/store/events/close-main-window-event';
import { ShowMainWindowEvent } from './mainwindow/store/events/show-main-window-event';
import { TwitchAuthService } from './mainwindow/twitch-auth.service';

const HEARTHSTONE_GAME_ID = 9898;

declare var overwolf: any;
declare var ga: any;

@Injectable()
export class AppBootstrapService {

	private static readonly STATES = ['INIT', 'READY'];
	private static readonly LOADING_SCREEN_DURATION = 10000;

	private currentState = 'INIT';
    private loadingWindowId: string;
    private loadingWindowShown = false;
    
    constructor(
            private store: MainWindowStoreService,
            private twitchAuth: TwitchAuthService,
            private debugService: DebugService,
            private dev: DevService, 
            private collectionDb: IndexedDbService,
            private achievementsDb: AchievementsDb,
            private packMonitor: PackMonitor,
            private packHistory: PackHistoryService,
            private publicEventsListener: HsPublicEventsListener,
            private achievementsMonitor: AchievementsMonitor,
            private achievementsVideoCaptureService: AchievementsVideoCaptureService,
            private packStatsService: PackStatsService,
            private achievementStatsService: AchievementStatsService,
            private collectionManager: CollectionManager,
            private deckParserService: DeckParserService,
            private gameStateService: GameStateService,
            private settingsCommunicationService: SettingsCommunicationService,
            private logStatusService: LogStatusService) {

    }

	public init() {
        console.log('in init');
        if (!this.loadingWindowShown) {
            console.log('initializing loading window');
            this.loadingWindowShown = true;
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
        }
        
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
			console.log('updated game status', res);
			if (this.exitGame(res)) {
				this.closeApp();
			}
			else if (this.gameRunning(res.gameInfo)) {
                console.log('game is running, showing loading screen', res);
				this.showLoadingScreen();
			}
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
			AppBootstrapService.LOADING_SCREEN_DURATION);
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
