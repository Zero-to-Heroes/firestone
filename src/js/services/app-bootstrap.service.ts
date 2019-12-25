import { EventEmitter, Injectable } from '@angular/core';
import { AchievementsMonitor } from './achievement/achievements-monitor.service';
import { AchievementsNotificationService } from './achievement/achievements-notification.service';
import { AchievementsVideoCaptureService } from './achievement/achievements-video-capture.service';
import { AchievementsLocalDbService as AchievementsDb } from './achievement/indexed-db.service';
import { RemoteAchievementsService } from './achievement/remote-achievements.service';
import { BattlegroundsStateService } from './battlegrounds/battlegrounds-state.service';
import { CollectionManager } from './collection/collection-manager.service';
import { IndexedDbService } from './collection/indexed-db.service';
import { PackHistoryService } from './collection/pack-history.service';
import { PackMonitor } from './collection/pack-monitor.service';
import { PackStatsService } from './collection/pack-stats.service';
import { DebugService } from './debug.service';
import { DeckParserService } from './decktracker/deck-parser.service';
import { GameStateService } from './decktracker/game-state.service';
import { OverlayDisplayService } from './decktracker/overlay-display.service';
import { DevService } from './dev.service';
import { GlobalStatsNotifierService } from './global-stats/global-stats-notifier.service';
import { AchievementsBootstrapService } from './mainwindow/store/achievements-bootstrap.service';
import { CollectionBootstrapService } from './mainwindow/store/collection-bootstrap.service';
import { ChangeVisibleApplicationEvent } from './mainwindow/store/events/change-visible-application-event';
import { CloseMainWindowEvent } from './mainwindow/store/events/close-main-window-event';
import { MainWindowStoreEvent } from './mainwindow/store/events/main-window-store-event';
import { ShowMainWindowEvent } from './mainwindow/store/events/show-main-window-event';
import { GameStatsBootstrapService } from './mainwindow/store/game-stats-bootstrap.service';
import { GlobalStatsBootstrapService } from './mainwindow/store/global-stats-bootstrap.service';
import { MainWindowStoreService } from './mainwindow/store/main-window-store.service';
import { TwitchAuthService } from './mainwindow/twitch-auth.service';
import { EndGameListenerService } from './manastorm-bridge/end-game-listener.service';
import { OverwolfService } from './overwolf.service';
import { ReplaysNotificationService } from './replays/replays-notification.service';
import { SettingsCommunicationService } from './settings/settings-communication.service';

declare var amplitude: any;

@Injectable()
export class AppBootstrapService {
	private static readonly STATES = ['INIT', 'READY'];
	private static readonly LOADING_SCREEN_DURATION = 10000;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private currentState = 'INIT';
	private loadingWindowId: string;
	private loadingWindowShown = false;
	// Seomtimes multiple events can fire in a row, which leads to the app
	// trying to close windows several times in a row
	// private closing = false;
	private wrapUpTimeout;

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
		private achievementsMonitor: AchievementsMonitor,
		private init_AchievementsNotifications: AchievementsNotificationService,
		private achievementsVideoCaptureService: AchievementsVideoCaptureService,
		private packStatsService: PackStatsService,
		private achievementStatsService: RemoteAchievementsService,
		private collectionManager: CollectionManager,
		private deckParserService: DeckParserService,
		private gameStateService: GameStateService,
		private settingsCommunicationService: SettingsCommunicationService,
		private init_decktrackerDisplayService: OverlayDisplayService,
		private init_endGameListenerService: EndGameListenerService,
		private init_GlobalStatsNotifierService: GlobalStatsNotifierService,
		private init_ReplaysNotificationService: ReplaysNotificationService,
		private init_BattlegroundsStateService: BattlegroundsStateService,
		private init_AchievementsBootstrapService: AchievementsBootstrapService,
		private init_CollectionBootstrapService: CollectionBootstrapService,
		private init_GameStatsBootstrapService: GameStatsBootstrapService,
		private init_GlobalStatsBootstrapService: GlobalStatsBootstrapService,
	) {}

	public async init() {
		console.log('in init');
		if (!this.loadingWindowShown) {
			console.log('initializing loading window');
			this.loadingWindowShown = true;
			const window = await this.ow.obtainDeclaredWindow('LoadingWindow');
			this.loadingWindowId = window.id;
			// await this.ow.restoreWindow(this.loadingWindowId);
			// await this.ow.hideWindow(this.loadingWindowId);
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
		this.ow.addHotKeyPressedListener('collection', async hotkeyResult => {
			console.log('hotkey pressed', hotkeyResult);
			if (hotkeyResult.status === 'success') {
				const window = await this.ow.obtainDeclaredWindow(OverwolfService.COLLECTION_WINDOW);
				if (window.isVisible) {
					this.store.stateUpdater.next(new CloseMainWindowEvent());
					await this.ow.hideWindow(window.id);
					// await this.ow.closeWindow(window.id);
				} else {
					this.startApp(true);
				}
			} else {
				console.log('could not trigger hotkey', hotkeyResult, this.currentState);
			}
		});
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			console.log('updated game status', res);
			// Issue is that this is triggered when launching the game
			// if (!this.exitGame(res) && this.wrapUpTimeout) {
			// 	console.log('cancelling app close', res);
			// 	clearTimeout(this.wrapUpTimeout);
			// 	this.wrapUpTimeout = null;
			// }
			if (this.exitGame(res) && res.runningChanged && !this.wrapUpTimeout) {
				console.log('left game, closing app', res);
				this.showReplaysRecap();
				// this.wrapUpTimeout = setTimeout(() => {
				// }, 1);
			} else if (await this.ow.inGame()) {
				console.log('game is running, showing loading screen');
				this.showLoadingScreen();
			}
		});
		const collectionWindow = await this.ow.obtainDeclaredWindow(OverwolfService.COLLECTION_WINDOW);
		// await this.ow.restoreWindow(collectionWindow.id);
		await this.ow.hideWindow(collectionWindow.id);
		this.startApp(false);
		this.ow.addAppLaunchTriggeredListener(() => {
			this.startApp(true);
		});

		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		const settingsWindow = await this.ow.obtainDeclaredWindow(OverwolfService.SETTINGS_WINDOW);
		// await this.ow.restoreWindow(settingsWindow.id);
		await this.ow.hideWindow(settingsWindow.id);
		// const [
		// 	settingsWindow,
		// 	// battlegroundsPlayerInfoWindow,
		// 	// battlegroundsLeaderboardOverwlayWindow,
		// ] = await Promise.all([
		// 	this.ow.obtainDeclaredWindow(OverwolfService.SETTINGS_WINDOW),
		// 	// this.ow.obtainDeclaredWindow(OverwolfService.BATTLEGROUNDS_PLAYER_INFO_WINDOW),
		// 	// this.ow.obtainDeclaredWindow(OverwolfService.BATTLEGROUNDS_LEADERBOARD_OVERLAY_WINDOW),
		// ]);
		// await Promise.all([
		// 	this.ow.restoreWindow(settingsWindow.id),
		// 	// this.ow.restoreWindow(battlegroundsPlayerInfoWindow.id),
		// 	// this.ow.restoreWindow(battlegroundsLeaderboardOverwlayWindow.id),
		// ]);
		// await Promise.all([
		// 	this.ow.hideWindow(settingsWindow.id),
		// 	// this.ow.hideWindow(battlegroundsPlayerInfoWindow.id),
		// 	// this.ow.hideWindow(battlegroundsLeaderboardOverwlayWindow.id),
		// ]);
		amplitude.getInstance().logEvent('start-app', { 'version': process.env.APP_VERSION });
	}

	private async showLoadingScreen() {
		console.log('showing loading screen?', this.currentState, this.loadingWindowId);
		if (this.currentState === 'READY') {
			return;
		}
		const result = await this.ow.restoreWindow(this.loadingWindowId);
		// this.closeCollectionWindow();
		console.log('final restore for loadingwindow done', result);
		setTimeout(() => {
			this.notifyAbilitiesReady();
		}, AppBootstrapService.LOADING_SCREEN_DURATION);
	}

	private notifyAbilitiesReady() {
		this.currentState = 'READY';
		this.ow.sendMessage(this.loadingWindowId, 'ready', 'ready');
	}

	private async startApp(showMainWindow: boolean) {
		const isRunning = await this.ow.inGame();
		console.log('are we in game?', isRunning);
		if (!isRunning || showMainWindow) {
			this.showCollectionWindow();
		}
	}

	private async closeLoadingScreen() {
		const window = await this.ow.obtainDeclaredWindow(OverwolfService.LOADING_WINDOW);
		// await this.ow.hideWindow(window.id);
		await this.ow.closeWindow(window.id);
	}

	// private async closeCollectionWindow() {
	// 	const window = await this.ow.obtainDeclaredWindow(OverwolfService.COLLECTION_WINDOW);
	// 	// this.ow.hideWindow(window.id);
	// 	await this.ow.closeWindow(window.id);
	// }

	private async showCollectionWindow() {
		console.log('reading to show collection window');
		const window = await this.ow.obtainDeclaredWindow(OverwolfService.COLLECTION_WINDOW);
		this.store.stateUpdater.next(new ShowMainWindowEvent());
		await this.ow.restoreWindow(window.id);
		this.closeLoadingScreen();
	}

	private exitGame(gameInfoResult: any): boolean {
		return !gameInfoResult || !gameInfoResult.gameInfo || !gameInfoResult.gameInfo.isRunning;
	}

	private async showReplaysRecap() {
		// Close all windows
		// const windows = await this.ow.getOpenWindows();
		// console.log('closing all windows', windows);
		// for (const [name, window] of Object.entries(windows)) {
		// 	// Close the main window last
		// 	if (name !== OverwolfService.MAIN_WINDOW) {
		// 		console.log('closing window', name, window);
		// 		this.ow.closeWindowFromName(name);
		// 	}
		// }
		this.stateUpdater.next(new ChangeVisibleApplicationEvent('replays'));
		// this.ow.closeWindowFromName(OverwolfService.MAIN_WINDOW);
	}
}
