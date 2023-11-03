import { EventEmitter, Injectable } from '@angular/core';
import { LOADING_SCREEN_DURATION } from '@components/loading/loading.component';
import { generateToken } from '@components/third-party/out-of-cards-callback.component';
import { ApiRunner, OverwolfService, WindowManagerService } from '@firestone/shared/framework/core';
import { GameStatusService } from '@legacy-import/src/lib/js/services/game-status.service';
import { FORCE_LOCAL_PROP, Preferences } from '../../js/models/preferences';
import { FirestoneAchievementsChallengeService } from '../../js/services/achievement/firestone-achievements-challenges.service';
import { AdService } from '../../js/services/ad.service';
import { LocalizationFacadeService } from '../../js/services/localization-facade.service';
import { OutOfCardsService, OutOfCardsToken } from '../../js/services/mainwindow/out-of-cards.service';
import { ChangeVisibleApplicationEvent } from '../../js/services/mainwindow/store/events/change-visible-application-event';
import { CloseMainWindowEvent } from '../../js/services/mainwindow/store/events/close-main-window-event';
import { MainWindowStoreEvent } from '../../js/services/mainwindow/store/events/main-window-store-event';
import { ShowMainWindowEvent } from '../../js/services/mainwindow/store/events/show-main-window-event';
import { MainWindowStoreService } from '../../js/services/mainwindow/store/main-window-store.service';
import { TwitchAuthService } from '../../js/services/mainwindow/twitch-auth.service';
import { OwNotificationsService } from '../../js/services/notifications.service';
import { PreferencesService } from '../../js/services/preferences.service';

@Injectable()
export class AppStartupService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	private currentState = 'INIT';
	private loadingWindowShown = false;
	private collectionHotkeyListener;

	constructor(
		private readonly store: MainWindowStoreService,
		private readonly ow: OverwolfService,
		private readonly gameStatus: GameStatusService,
		private readonly initFirestoneChallenges: FirestoneAchievementsChallengeService,
		private readonly prefs: PreferencesService,
		private readonly twitchAuth: TwitchAuthService,
		private readonly oocAuth: OutOfCardsService,
		private readonly ads: AdService,
		private readonly localizationService: LocalizationFacadeService,
		private readonly notifs: OwNotificationsService,
		private readonly api: ApiRunner,
		private readonly windowManager: WindowManagerService,
	) {}

	public async init() {
		console.log('[startup] essential services started, in doInit()');
		// Do it after the localization has been initialized
		await this.store.init();

		if (!this.loadingWindowShown) {
			console.debug('[startup] initializing loading window');
			const isRunning = await this.ow.inGame();
			if (isRunning) {
				this.showLoadingScreen();
			}
		}

		console.log('[startup] app init starting');
		this.windowManager.registerGlobalService('mainWindowHotkeyPressed', () => this.onHotkeyPress());
		this.windowManager.registerGlobalService('reloadWindows', () => this.reloadWindows());
		this.windowManager.registerGlobalService('reloadBgWindows', () => this.reloadBgWindows());

		if (!this.collectionHotkeyListener) {
			this.collectionHotkeyListener = this.ow.addHotKeyPressedListener('collection', async (hotkeyResult) => {
				if (this.currentState !== 'READY') {
					return;
				}
				this.onHotkeyPress();
			});
		}

		this.gameStatus.onGameStart(() => {
			this.showFullScreenOverlaysWindow();
			this.showLoadingScreen();
		});
		this.gameStatus.onGameExit(async (res) => {
			this.ow.closeWindow(OverwolfService.FULL_SCREEN_OVERLAYS_WINDOW);
			this.ow.closeWindow(OverwolfService.FULL_SCREEN_OVERLAYS_CLICKTHROUGH_WINDOW);
			// This can happen when we're in another game, so we exit the app for good

			if (this.ow.inAnotherGame(res)) {
				this.ow.minimizeWindow(OverwolfService.COLLECTION_WINDOW);
				this.ow.minimizeWindow(OverwolfService.COLLECTION_WINDOW_OVERLAY);
				this.ow.closeWindow(OverwolfService.SETTINGS_WINDOW);
				this.ow.closeWindow(OverwolfService.SETTINGS_WINDOW_OVERLAY);
			} else if (res.runningChanged) {
				this.loadingWindowShown = false;
				this.closeLoadingScreen();
				this.handleExitGame();
			}
		});

		const prefs = await this.prefs.getPreferences();
		await this.ow.hideCollectionWindow(prefs);

		// this.store.stateUpdater.next(new CloseMainWindowEvent());
		this.startApp(false);
		// TOOD: move this elsewhere
		this.ow.addAppLaunchTriggeredListener(async (info) => {
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
			} else if (
				info?.origin === 'urlscheme' &&
				decodeURIComponent(info.parameter).startsWith('firestoneapp://outofcards-callback')
			) {
				const codeCommponent = decodeURIComponent(info.parameter).split(
					'firestoneapp://outofcards-callback/?',
				)[1];
				const code = codeCommponent.split('code=')[1];
				console.debug('[oog] handling oog callback', info, code, decodeURIComponent(info.parameter));
				const token: OutOfCardsToken = await generateToken(code, this.api);
				console.debug('[oog] received token', token);
				if (token) {
					this.oocAuth.stateUpdater.next(token);
				}
			} else {
				this.startApp(true);
			}
		});

		this.stateUpdater = await this.windowManager.getGlobalService('mainWindowStoreUpdater');
		const settingsWindow = await this.ow.getSettingsWindow(prefs);
		await this.ow.hideWindow(settingsWindow.id);
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
			console.log('[startup] closing main window');
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
		console.log('[startup] showing loading screen?', this.currentState);

		// Don't open the loading window if the main window is open
		const prefs = await this.prefs.getPreferences();
		const collectionWindow = await this.ow.getCollectionWindow(prefs);
		const shouldShowAds = await this.ads.shouldDisplayAds();
		if (shouldShowAds && !collectionWindow.isVisible) {
			await this.windowManager.showWindow(OverwolfService.LOADING_WINDOW, { bringToFront: true });
			console.log('[startup] final restore for loadingwindow done');
			setTimeout(() => {
				this.currentState = 'READY';
			}, LOADING_SCREEN_DURATION);
		} else {
			this.currentState = 'READY';
			if (!shouldShowAds) {
				const title = this.localizationService.translateString('app.internal.startup.firestone-ready-title');
				const text = this.localizationService.translateString('app.internal.startup.firestone-ready-text');
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
								<span>${title}</span>
							</div>
							<span class="text">${text}</span>
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
	}

	private async startApp(showMainWindow: boolean) {
		const isRunning = await this.ow.inGame();
		console.log('[startup] are we in game?', isRunning);
		// Show main window directly only if started on desktop
		if (!isRunning || showMainWindow) {
			this.showCollectionWindow();
		}
		if (isRunning) {
			this.showFullScreenOverlaysWindow();
		}
	}

	private async closeLoadingScreen() {
		await this.windowManager.closeWindow(OverwolfService.LOADING_WINDOW);
	}

	private async showCollectionWindow() {
		// console.log('showing collection window');
		// We do both store and direct restore to keep things snappier
		const prefs = await this.prefs.getPreferences();
		const window = await this.ow.getCollectionWindow(prefs);
		this.ow.restoreWindow(window.id);
		this.ow.bringToFront(window.id);
		this.store.stateUpdater.next(new ShowMainWindowEvent());
		this.ow.closeWindow(OverwolfService.LOADING_WINDOW);
	}

	private async showFullScreenOverlaysWindow() {
		// console.log('[startup] ready to show full screen overlays window');
		this.windowManager.showWindow(OverwolfService.FULL_SCREEN_OVERLAYS_WINDOW);
		this.windowManager.showWindow(OverwolfService.FULL_SCREEN_OVERLAYS_CLICKTHROUGH_WINDOW);
	}

	private async handleExitGame() {
		const prefs = (await this.prefs.getPreferences()) ?? new Preferences();
		this.prefs.updateRemotePreferences();
		if (prefs.showSessionRecapOnExit && this.stateUpdater) {
			this.stateUpdater.next(new ChangeVisibleApplicationEvent('replays'));
		} else {
			// Don't close Firestone when leaving HS
			// this.ow.closeWindow(OverwolfService.MAIN_WINDOW);
		}
	}

	private async addAnalytics() {
		const toRemovePrefix = [
			'overlayZoneToggle',
			'duelsPersonalDeckNames',
			'desktopDeckStatsReset',
			'desktopDeckDeletes',
			'duelsDeckDeletes',
		];
		const toRemoveSuffix = ['.top', '.bottom', '.left', '.right'];
		const prefs = await this.prefs.getPreferences();
		// Log an event for each of the prefs
		const prefsToSend = { ...new Preferences() };
		for (const prop in prefs) {
			const meta = Reflect.getMetadata(FORCE_LOCAL_PROP, prefsToSend, prop);
			if (
				!meta &&
				!toRemovePrefix.some((propToRemove) => prop.startsWith(propToRemove)) &&
				!toRemoveSuffix.some((propToRemove) => prop.endsWith(propToRemove))
			) {
				prefsToSend[prop] = prefs[prop];
			}
		}
		delete prefsToSend.desktopDeckDeletes;
		delete prefsToSend.desktopDeckStatsReset;
	}
}
