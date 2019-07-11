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
import { SettingsCommunicationService } from './settings/settings-communication.service';
import { MainWindowStoreService } from './mainwindow/store/main-window-store.service';
import { DebugService } from './debug.service';
import { DevService } from './dev.service';
import { IndexedDbService } from './collection/indexed-db.service';
import { IndexedDbService as AchievementsDb } from './achievement/indexed-db.service';
import { CloseMainWindowEvent } from './mainwindow/store/events/close-main-window-event';
import { ShowMainWindowEvent } from './mainwindow/store/events/show-main-window-event';
import { TwitchAuthService } from './mainwindow/twitch-auth.service';
import { OverwolfService } from './overwolf.service';

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
            private ow: OverwolfService,
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
            private settingsCommunicationService: SettingsCommunicationService) {

    }

	public async init() {
        console.log('in init');
        if (!this.loadingWindowShown) {
            console.log('initializing loading window');
            this.loadingWindowShown = true;
            const window = await this.ow.obtainDeclaredWindow('LoadingWindow');
            this.loadingWindowId = window.id;
            await this.ow.restoreWindow(this.loadingWindowId);
            await this.ow.hideWindow(this.loadingWindowId);
            const isRunning = await this.ow.inGame();
            if (isRunning) {
                this.showLoadingScreen();
            }
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
        this.ow.addHotKeyPressedListener('collection', async (hotkeyResult) => {
            console.log('hotkey pressed', hotkeyResult)
            if (hotkeyResult.status === 'success') {
                const window = await this.ow.obtainDeclaredWindow(OverwolfService.COLLECTION_WINDOW);
                if (window.isVisible) {
                    this.store.stateUpdater.next(new CloseMainWindowEvent());
                    await this.ow.hideWindow(window.id);
                }
                else {
                    this.closeWelcomeWindow();
                    this.startApp(() => this.showCollectionWindow());
                }
            }
            else {
                console.log('could not trigger hotkey', hotkeyResult, this.currentState);
            }
        });
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			console.log('updated game status', res);
			if (this.exitGame(res)) {
				this.closeApp();
			}
			else if (await this.ow.inGame()) {
                console.log('game is running, showing loading screen', res);
				this.showLoadingScreen();
			}
		});
        const collectionWindow = await this.ow.obtainDeclaredWindow(OverwolfService.COLLECTION_WINDOW);
        await this.ow.restoreWindow(collectionWindow.id);
        await this.ow.hideWindow(collectionWindow.id);
        this.startApp();
        this.ow.addAppLaunchTriggeredListener((result) => {
            this.startApp(() => this.showCollectionWindow());
        })
        ga('send', 'event', 'toast', 'start-app');
        const settingsWindow = await this.ow.obtainDeclaredWindow(OverwolfService.SETTINGS_WINDOW);
        await this.ow.restoreWindow(settingsWindow.id);
        await this.ow.hideWindow(settingsWindow.id);
	}

	private async showLoadingScreen() {
		console.log('showing loading screen?', this.currentState, this.loadingWindowId);
		if (this.currentState == 'READY') {
			return;
		}
        const result = await this.ow.restoreWindow(this.loadingWindowId);
        this.closeWelcomeWindow();
        this.closeCollectionWindow();
        console.log('final restore for loadingwindow done', result);
        setTimeout(() => {
            this.notifyAbilitiesReady();
        }, AppBootstrapService.LOADING_SCREEN_DURATION);
	}

	private notifyAbilitiesReady() {
        this.currentState = 'READY';
        this.ow.sendMessage(this.loadingWindowId, 'ready', 'ready');
	}

	private async startApp(showWhenStarted?: Function) {
        const isRunning = await this.ow.inGame();
        if (isRunning) {
            if (showWhenStarted) {
                showWhenStarted();
            }
        }
        else {
            this.showWelcomePage();
        }
	}

	private async closeLoadingScreen() {
        const window = await this.ow.obtainDeclaredWindow(OverwolfService.LOADING_WINDOW);
        await this.ow.hideWindow(window.id);
	}

	private async closeWelcomeWindow() {
        const window = await this.ow.obtainDeclaredWindow(OverwolfService.WELCOME_WINDOW);
        this.ow.hideWindow(window.id);
	}

	private async closeCollectionWindow() {
        const window = await this.ow.obtainDeclaredWindow(OverwolfService.COLLECTION_WINDOW);
        this.ow.hideWindow(window.id);
	}

	private async showWelcomePage() {
        const window = await this.ow.obtainDeclaredWindow(OverwolfService.WELCOME_WINDOW);
        await this.ow.restoreWindow(window.id);
        this.closeLoadingScreen();
	}

	private async showCollectionWindow() {
        console.log('reading to show collection window');
        const window = await this.ow.obtainDeclaredWindow(OverwolfService.COLLECTION_WINDOW);
        console.log('sending new event', this.store);
        this.store.stateUpdater.next(new ShowMainWindowEvent());
        console.log('sent new event', this.store);
        await this.ow.restoreWindow(window.id);
        this.closeLoadingScreen();
	}

	private exitGame(gameInfoResult: any): boolean {
		return (!gameInfoResult || !gameInfoResult.gameInfo || !gameInfoResult.gameInfo.isRunning);
	}

	private async closeApp() {
        // Close all windows
        const windows = await this.ow.getOpenWindows()
        for (let window of windows) {
            this.ow.closeWindowFromName(window);
        }
	}
}
