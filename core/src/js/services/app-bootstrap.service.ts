import { EventEmitter, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Preferences } from '../models/preferences';
import { AchievementsMonitor } from './achievement/achievements-monitor.service';
import { AchievementsNotificationService } from './achievement/achievements-notification.service';
import { AchievementsStorageService as AchievementsDb } from './achievement/achievements-storage.service';
import { AchievementsLoaderService } from './achievement/data/achievements-loader.service';
import { RemoteAchievementsService } from './achievement/remote-achievements.service';
import { AdService } from './ad.service';
import { BgsBestUserStatsService } from './battlegrounds/bgs-best-user-stats.service';
import { BgsInitService } from './battlegrounds/bgs-init.service';
import { BattlegroundsStoreService } from './battlegrounds/store/battlegrounds-store.service';
import { RealTimeStatsService } from './battlegrounds/store/real-time-stats/real-time-stats.service';
import { CardsMonitorService } from './collection/cards-monitor.service';
import { CollectionManager } from './collection/collection-manager.service';
import { CollectionStorageService } from './collection/collection-storage.service';
import { PackMonitor } from './collection/pack-monitor.service';
import { PackStatsService } from './collection/pack-stats.service';
import { DebugService } from './debug.service';
import { ArenaRunParserService } from './decktracker/arena-run-parser.service';
import { DeckParserService } from './decktracker/deck-parser.service';
import { DungeonLootParserService } from './decktracker/dungeon-loot-parser.service';
import { GameStateService } from './decktracker/game-state.service';
import { OverlayDisplayService } from './decktracker/overlay-display.service';
import { DevService } from './dev.service';
import { GlobalStatsNotifierService } from './global-stats/global-stats-notifier.service';
import { LocalizationService } from './localization.service';
import { LogRegisterService } from './log-register.service';
import { OutOfCardsService } from './mainwindow/out-of-cards.service';
import { CollectionBootstrapService } from './mainwindow/store/collection-bootstrap.service';
import { ChangeVisibleApplicationEvent } from './mainwindow/store/events/change-visible-application-event';
import { CloseMainWindowEvent } from './mainwindow/store/events/close-main-window-event';
import { MainWindowStoreEvent } from './mainwindow/store/events/main-window-store-event';
import { ShowMainWindowEvent } from './mainwindow/store/events/show-main-window-event';
import { MainWindowStoreService } from './mainwindow/store/main-window-store.service';
import { TwitchAuthService } from './mainwindow/twitch-auth.service';
import { EndGameListenerService } from './manastorm-bridge/end-game-listener.service';
import { MercenariesSynergiesHighlightService } from './mercenaries/highlights/mercenaries-synergies-highlight.service';
import { MercenariesMemoryUpdateService } from './mercenaries/mercenaries-memory-updates.service';
import { MercenariesStoreService } from './mercenaries/mercenaries-store.service';
import { MercenariesOutOfCombatService } from './mercenaries/out-of-combat/mercenaries-out-of-combat.service';
import { OwNotificationsService } from './notifications.service';
import { OverwolfService } from './overwolf.service';
import { PreferencesService } from './preferences.service';
import { ReplaysNotificationService } from './replays/replays-notification.service';
import { RewardMonitorService } from './rewards/rewards-monitor';
import { SettingsCommunicationService } from './settings/settings-communication.service';
import { AppUiStoreService } from './ui-store/app-ui-store.service';
import { sleep } from './utils';

declare let amplitude: any;

@Injectable()
export class AppBootstrapService {
	private static readonly STATES = ['INIT', 'READY'];
	private static readonly LOADING_SCREEN_DURATION = 20000;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private currentState = 'INIT';
	private loadingWindowId: string;
	private loadingWindowShown = false;
	private collectionHotkeyListener;

	constructor(
		private store: MainWindowStoreService,
		private ow: OverwolfService,
		private ads: AdService,
		private twitchAuth: TwitchAuthService,
		private init_OutOfCardsAuth: OutOfCardsService,
		private debugService: DebugService,
		private dev: DevService,
		private collectionDb: CollectionStorageService,
		private achievementsDb: AchievementsDb,
		private achievementsLoader: AchievementsLoaderService,
		private packMonitor: PackMonitor,
		private achievementsMonitor: AchievementsMonitor,
		private init_AchievementsNotifications: AchievementsNotificationService,
		private packStatsService: PackStatsService,
		private achievementStatsService: RemoteAchievementsService,
		private collectionManager: CollectionManager,
		private deckParserService: DeckParserService,
		private init_dungeonLootParserService: DungeonLootParserService,
		private init_arenaRunService: ArenaRunParserService,
		private gameStateService: GameStateService,
		private prefs: PreferencesService,
		private notifs: OwNotificationsService,
		private translate: TranslateService,
		private settingsCommunicationService: SettingsCommunicationService,
		private init_decktrackerDisplayService: OverlayDisplayService,
		private init_endGameListenerService: EndGameListenerService,
		private init_GlobalStatsNotifierService: GlobalStatsNotifierService,
		private init_ReplaysNotificationService: ReplaysNotificationService,
		private init_CollectionBootstrapService: CollectionBootstrapService,
		private init_BgsStoreService: BattlegroundsStoreService,
		private init_BgsInitService: BgsInitService,
		private init_BgsBestUserStatsService: BgsBestUserStatsService,
		private init_LogRegisterService: LogRegisterService,
		private init_RewardMonitorService: RewardMonitorService,
		private init_BgsRealTimeStatsService: RealTimeStatsService,
		private init_LogParserService: CardsMonitorService,
		private init_MercenariesStoreService: MercenariesStoreService,
		private init_MercenariesOutOfCombatService: MercenariesOutOfCombatService,
		private init_MercenariesSynergiesHighlightService: MercenariesSynergiesHighlightService,
		private init_MercenariesMemoryUpdateService: MercenariesMemoryUpdateService,
		private init_AppUiStoreService: AppUiStoreService,
		private init_LocalizationService: LocalizationService,
	) {}

	public async init() {
		console.log('[bootstrap] in init');
		await sleep(1);
		this.init_AppUiStoreService.start();
		this.init_LocalizationService.start();
		this.doInit();
	}

	private async doInit() {
		// this language will be used as a fallback when a translation isn't found in the current language
		this.translate.setDefaultLang('enUS');
		window['translateService'] = this.translate;

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
				this.doInit();
			}, 200);
			return;
		}
		if (!this.achievementsDb.dbInit) {
			setTimeout(() => {
				this.doInit();
			}, 200);
			return;
		}
		console.log('[bootstrap] app init starting');
		window['mainWindowHotkeyPressed'] = () => this.onHotkeyPress();
		window['reloadWindows'] = () => this.reloadWindows();
		window['reloadBgWindows'] = () => this.reloadBgWindows();

		if (!this.collectionHotkeyListener) {
			this.collectionHotkeyListener = this.ow.addHotKeyPressedListener('collection', async (hotkeyResult) => {
				if (this.currentState !== 'READY') {
					return;
				}
				this.onHotkeyPress();
			});
		}
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (this.ow.exitGame(res)) {
				// This can happen when we're in another game, so we exit the app for good

				if (this.ow.inAnotherGame(res)) {
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
					(await this.achievementsLoader.getChallengeModules()).forEach((challenge) =>
						challenge.resetState(),
					);
					this.handleExitGame();
				}
			} else if (await this.ow.inGame()) {
				this.showLoadingScreen();
			}
		});
		// const collectionWindow = await this.ow.obtainDeclaredWindow(OverwolfService.COLLECTION_WINDOW);
		const prefs = await this.prefs.getPreferences();
		await this.ow.hideCollectionWindow(prefs);

		// the lang to use, if the lang isn't available, it will use the current loader to get them
		await this.translate.use(prefs.locale).toPromise();
		console.log(
			'using locale for app',
			prefs.locale,
			this.translate.currentLang,
			await this.translate.get('app.menu.go-premium-header').toPromise(),
		);

		// await this.ow.hideWindow(collectionWindow.id);
		this.store.stateUpdater.next(new CloseMainWindowEvent());
		this.startApp(false);
		this.ow.addAppLaunchTriggeredListener((info) => {
			console.debug('received app launch event', info);
			if (
				info?.origin === 'urlscheme' &&
				decodeURIComponent(info.parameter).startsWith('firestoneapp://twitch/')
			) {
				const hash = decodeURIComponent(info.parameter).split('firestoneapp://twitch/')[1];
				const hashAsObject: any = hash
					?.substring(1)
					.split('&')
					.map((v) => v.split('='))
					.reduce((pre, [key, value]) => ({ ...pre, [key]: value }), {});
				console.log('hash is', hashAsObject);
				this.twitchAuth.stateUpdater.next(hashAsObject);
			} else {
				this.startApp(true);
			}
		});

		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		const settingsWindow = await this.ow.getSettingsWindow(prefs);
		await this.ow.hideWindow(settingsWindow.id);
		amplitude.getInstance().logEvent('start-app', { 'version': process.env.APP_VERSION });
		setTimeout(() => this.addAnalytics());

		this.prefs.init();
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

	private async reloadBgWindows() {
		console.log('reloading BG windows in app bootstrap');
		const prefs: Preferences = await this.prefs.getPreferences();
		this.ow.closeWindow(OverwolfService.BATTLEGROUNDS_WINDOW);
		this.ow.closeWindow(OverwolfService.BATTLEGROUNDS_WINDOW_OVERLAY);
		const bgWindows = await this.ow.getBattlegroundsWindow(prefs);
		await this.ow.restoreWindow(bgWindows.id);
		this.ow.bringToFront(bgWindows.id);
	}

	private async onHotkeyPress() {
		const prefs = await this.prefs.getPreferences();

		const window = await this.ow.getCollectionWindow(prefs);

		if (window.isVisible) {
			console.log('[bootstrap] closing main window');
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
		// const prefs = await this.prefs.getPreferences();
		// this.ow.hideCollectionWindow(prefs);

		const shouldShowAds = await this.ads.shouldDisplayAds();

		if (shouldShowAds) {
			await this.ow.obtainDeclaredWindow(OverwolfService.LOADING_WINDOW);
			const result = await this.ow.restoreWindow(OverwolfService.LOADING_WINDOW);
			console.log('[bootstrap] final restore for loadingwindow done', result);
			setTimeout(() => {
				this.notifyAbilitiesReady();
			}, AppBootstrapService.LOADING_SCREEN_DURATION);
		} else {
			this.currentState = 'READY';
			this.notifs.emitNewNotification({
				content: `
					<div class="general-message-container general-theme">
						<div class="firestone-icon">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
							</svg>
						</div>
						<div class="message">
							<div class="title">
								<span>Firestone ready to go</span>
							</div>
							<span class="text">Thank you for supporting us!</span>
						</div>
						<button class="i-30 close-button">
							<svg class="svg-icon-fill">
								<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
							</svg>
						</button>
					</div>`,
				notificationId: `app-ready`,
			});
		}
	}

	private notifyAbilitiesReady() {
		this.currentState = 'READY';
		this.ow.sendMessage(this.loadingWindowId, 'ready', 'ready');
	}

	private async startApp(showMainWindow: boolean) {
		const isRunning = await this.ow.inGame();
		console.log('[bootstrap] are we in game?', isRunning);
		// Show main window directly only if started on desktop
		if (!isRunning || showMainWindow) {
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

	private async handleExitGame() {
		const prefs = (await this.prefs.getPreferences()) ?? new Preferences();
		this.prefs.updateRemotePreferences();
		if (prefs.showSessionRecapOnExit && this.stateUpdater) {
			this.stateUpdater.next(new ChangeVisibleApplicationEvent('replays'));
		} else {
			this.ow.closeWindow(OverwolfService.MAIN_WINDOW);
		}
	}

	private async addAnalytics() {
		const prefs = await this.prefs.getPreferences();
		// Log an event for each of the prefs
		console.log('no-format', 'pref status', prefs);
		amplitude.getInstance().logEvent('preferences', {
			...prefs,
		});
	}
}
