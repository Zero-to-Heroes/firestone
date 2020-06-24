import { EventEmitter, Injectable } from '@angular/core';
import { Preferences } from '../models/preferences';
import { AchievementsMonitor } from './achievement/achievements-monitor.service';
import { AchievementsNotificationService } from './achievement/achievements-notification.service';
import { AchievementsVideoCaptureService } from './achievement/achievements-video-capture.service';
import { AchievementsLoaderService } from './achievement/data/achievements-loader.service';
import { AchievementsLocalDbService as AchievementsDb } from './achievement/indexed-db.service';
import { RemoteAchievementsService } from './achievement/remote-achievements.service';
import { BgsInitService } from './battlegrounds/bgs-init.service';
import { BattlegroundsStoreService } from './battlegrounds/store/battlegrounds-store.service';
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

declare let amplitude: any;

@Injectable()
export class AppBootstrapService {
	private static readonly STATES = ['INIT', 'READY'];
	private static readonly LOADING_SCREEN_DURATION = 20000;

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
		private achievementsLoader: AchievementsLoaderService,
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
		private init_AchievementsBootstrapService: AchievementsBootstrapService,
		private init_CollectionBootstrapService: CollectionBootstrapService,
		private init_GameStatsBootstrapService: GameStatsBootstrapService,
		private init_GlobalStatsBootstrapService: GlobalStatsBootstrapService,
		private init_BgsStoreService: BattlegroundsStoreService,
		private init_BgsInitService: BgsInitService,
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
		window['mainWindowHotkeyPressed'] = () => this.onHotkeyPress();
		window['reloadWindows'] = () => this.reloadWindows();
		this.ow.addHotKeyPressedListener('collection', async hotkeyResult => {
			// console.log('[bootstrap] hotkey pressed', hotkeyResult, this.currentState);
			if (this.currentState !== 'READY') {
				return;
			}
			if (hotkeyResult.status === 'success') {
				this.onHotkeyPress();
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
					this.ow.minimizeWindow(OverwolfService.COLLECTION_WINDOW_OVERLAY);
					this.ow.closeWindow(OverwolfService.SETTINGS_WINDOW);
					this.ow.closeWindow(OverwolfService.SETTINGS_WINDOW_OVERLAY);
				} else if (res.runningChanged) {
					this.loadingWindowShown = false;
					this.closeLoadingScreen();
					// Because Firestone can stay open between two game sessions, and if
					// the game was forced-closed, some achievements didn't have the opportunity
					// to reset, so we're forcing it here
					(await this.achievementsLoader.getChallengeModules()).forEach(challenge => challenge.resetState());
					this.showReplaysRecap();
				}
			} else if (await this.ow.inGame()) {
				console.log('[bootstrap] game is running, showing loading screen');
				this.showLoadingScreen();
			}
		});
		// const collectionWindow = await this.ow.obtainDeclaredWindow(OverwolfService.COLLECTION_WINDOW);
		const prefs = await this.prefs.getPreferences();
		await this.ow.hideCollectionWindow(prefs);
		// await this.ow.hideWindow(collectionWindow.id);
		this.store.stateUpdater.next(new CloseMainWindowEvent());
		this.startApp(false);
		this.ow.addAppLaunchTriggeredListener(() => {
			this.startApp(true);
		});

		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		const settingsWindow = await this.ow.getSettingsWindow(prefs);
		await this.ow.hideWindow(settingsWindow.id);
		amplitude.getInstance().logEvent('start-app', { 'version': process.env.APP_VERSION });
		setTimeout(() => this.addAnalytics());
	}

	private async reloadWindows() {
		console.log('reloading windows in app bootstrap');
		const prefs: Preferences = await this.prefs.getPreferences();
		this.ow.closeWindow(OverwolfService.COLLECTION_WINDOW);
		this.ow.closeWindow(OverwolfService.COLLECTION_WINDOW_OVERLAY);
		this.ow.closeWindow(OverwolfService.SETTINGS_WINDOW);
		this.ow.closeWindow(OverwolfService.SETTINGS_WINDOW_OVERLAY);
		const [mainWindow, settingsWindow] = await Promise.all([
			this.ow.getCollectionWindow(prefs),
			this.ow.getSettingsWindow(prefs),
		]);
		await this.ow.restoreWindow(mainWindow.id);
		// this.ow.bringToFront(mainWindow.id);
		await this.ow.restoreWindow(settingsWindow.id);
		this.ow.bringToFront(settingsWindow.id);
	}

	private async onHotkeyPress() {
		const prefs = await this.prefs.getPreferences();
		// console.log('pressing hotkey', prefs.collectionUseOverlay);
		const window = await this.ow.getCollectionWindow(prefs);
		// console.log('retrieved', prefs, window);
		if (window.isVisible) {
			// console.log('closing main window', this.store, this);
			this.store.stateUpdater.next(new CloseMainWindowEvent());
			await this.ow.hideCollectionWindow(prefs);
			// await this.ow.closeWindow(window.id);
		} else {
			this.showCollectionWindow();
		}
	}

	private async showLoadingScreen() {
		if (this.loadingWindowShown) {
			return;
		}
		this.loadingWindowShown = true;
		console.log('[bootstrap] showing loading screen?', this.currentState, this.loadingWindowId);
		const prefs = await this.prefs.getPreferences();
		this.ow.hideCollectionWindow(prefs);
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
		const prefs = await this.prefs.getPreferences();
		const window = await this.ow.getCollectionWindow(prefs);
		this.ow.restoreWindow(window.id);
		this.ow.bringToFront(window.id);
		this.store.stateUpdater.next(new ShowMainWindowEvent());
		this.ow.closeWindow(OverwolfService.LOADING_WINDOW);
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
		console.log('no-format', 'pref status', prefs);
		amplitude.getInstance().logEvent('preferences', {
			...prefs,
		});
		const monitorsList = await this.ow.getMonitorsList();
		// console.log('monitorsList', monitorsList);
		const numberOfMonitors = monitorsList && monitorsList.displays ? monitorsList.displays.length : -1;
		// console.log('number of monitors', numberOfMonitors, monitorsList);
		if (numberOfMonitors > 0) {
			amplitude.getInstance().logEvent('hardware', { 'number-of-monitors': numberOfMonitors });
		}
	}
}
