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
import { PreferencesService } from './preferences.service';
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
		private prefs: PreferencesService,
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
		console.log('[bootstrap] in init');
		if (!this.loadingWindowShown) {
			console.log('[bootstrap] initializing loading window');
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
		console.log('[bootstrap] app init starting');
		this.ow.addHotKeyPressedListener('collection', async hotkeyResult => {
			console.log('[bootstrap] hotkey pressed', hotkeyResult);
			if (hotkeyResult.status === 'success') {
				const window = await this.ow.obtainDeclaredWindow(OverwolfService.COLLECTION_WINDOW);
				if (window.isVisible) {
					this.store.stateUpdater.next(new CloseMainWindowEvent());
					await this.ow.hideCollectionWindow();
					// await this.ow.closeWindow(window.id);
				} else {
					this.showCollectionWindow();
				}
			} else {
				console.log('could not trigger hotkey', hotkeyResult, this.currentState);
			}
		});
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			// console.log('[bootstrap] updated game status', res);
			if (this.ow.exitGame(res)) {
				// This can happen when we're in another game, so we exit the app for good
				// console.log('[bootstrap] left game, showing replay tab', res);
				if (this.ow.inAnotherGame(res)) {
					// console.log('in another game, hiding app', res);
					this.ow.minimizeWindow(OverwolfService.COLLECTION_WINDOW);
					this.ow.closeWindow(OverwolfService.SETTINGS_WINDOW);
				} else if (res.runningChanged) {
					this.loadingWindowShown = false;
					this.closeLoadingScreen();
					this.showReplaysRecap();
				}
			} else if (await this.ow.inGame()) {
				console.log('[bootstrap] game is running, showing loading screen');
				this.showLoadingScreen();
			}
		});
		// const collectionWindow = await this.ow.obtainDeclaredWindow(OverwolfService.COLLECTION_WINDOW);
		await this.ow.hideCollectionWindow();
		// await this.ow.hideWindow(collectionWindow.id);
		this.store.stateUpdater.next(new CloseMainWindowEvent());
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
		setTimeout(() => this.addAnalytics());
	}

	private async showLoadingScreen() {
		if (this.loadingWindowShown) {
			return;
		}
		this.loadingWindowShown = true;
		console.log('[bootstrap] showing loading screen?', this.currentState, this.loadingWindowId);
		// if (this.currentState === 'READY') {
		// 	return;
		// }
		await this.ow.obtainDeclaredWindow(OverwolfService.LOADING_WINDOW);
		const result = await this.ow.restoreWindow(OverwolfService.LOADING_WINDOW);
		console.log('[bootstrap] final restore for loadingwindow done', result);
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
		console.log('[bootstrap] are we in game?', isRunning);
		// Show main window directly only if started on desktop
		if (!isRunning) {
			this.showCollectionWindow();
		}
	}

	private closeApp() {
		this.ow.closeWindow(OverwolfService.MAIN_WINDOW);
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
		console.log('[bootstrap] reading to show collection window');
		// We do both store and direct restore to keep things snappier
		const window = await this.ow.obtainDeclaredWindow(OverwolfService.COLLECTION_WINDOW);
		await this.ow.restoreWindow(window.id);
		this.store.stateUpdater.next(new ShowMainWindowEvent());
		this.closeLoadingScreen();
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

	private async addAnalytics() {
		const prefs = await this.prefs.getPreferences();
		if (prefs.batlegroundsShowHeroSelectionPref) {
			amplitude.getInstance().logEvent('beta', { 'feature': 'batlegroundsShowHeroSelectionPref' });
		}
		if (prefs.battlegroundsShowLastOpponentBoard) {
			amplitude.getInstance().logEvent('beta', { 'feature': 'battlegroundsShowLastOpponentBoard' });
		}
		// Log an event for each of the prefs
		console.log('pref status', prefs);
		for (let key of Object.keys(prefs)) {
			amplitude.getInstance().logEvent('preference-status', {
				'key': key,
				'value': prefs[key],
			});
		}
		const monitorsList = await this.ow.getMonitorsList();
		// console.log('monitorsList', monitorsList);
		const numberOfMonitors = monitorsList && monitorsList.displays ? monitorsList.displays.length : -1;
		// console.log('number of monitors', numberOfMonitors, monitorsList);
		if (numberOfMonitors > 0) {
			amplitude.getInstance().logEvent('hardware', { 'number-of-monitors': numberOfMonitors });
		}
	}
}
