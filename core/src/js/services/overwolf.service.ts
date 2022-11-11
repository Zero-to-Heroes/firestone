import { Injectable } from '@angular/core';
// import '@overwolf/types';
import { RedditUserInfo } from '../models/mainwindow/reddit-user-info';
import { TwitterUserInfo } from '../models/mainwindow/twitter-user-info';
import { ActiveSubscriptionPlan } from '../models/overwolf/profile/active-subscription-plan';
import { CurrentUser } from '../models/overwolf/profile/current-user';
import { Preferences } from '../models/preferences';

declare let overwolf: any;

const HEARTHSTONE_GAME_ID = 9898;
const NO_AD_PLAN = 13;

@Injectable()
export class OverwolfService {
	public static MAIN_WINDOW = 'MainWindow';
	public static COLLECTION_WINDOW = 'CollectionWindow';
	public static COLLECTION_WINDOW_OVERLAY = 'CollectionOverlayWindow';
	public static SETTINGS_WINDOW = 'SettingsWindow';
	public static SETTINGS_WINDOW_OVERLAY = 'SettingsOverlayWindow';
	public static LOADING_WINDOW = 'LoadingWindow';
	public static NOTIFICATIONS_WINDOW = 'NotificationsWindow';
	public static BATTLEGROUNDS_WINDOW = 'BattlegroundsWindow';
	public static BATTLEGROUNDS_WINDOW_OVERLAY = 'BattlegroundsOverlayWindow';
	public static FULL_SCREEN_OVERLAYS_WINDOW = 'FullScreenOverlaysWindow';
	public static FULL_SCREEN_OVERLAYS_CLICKTHROUGH_WINDOW = 'FullScreenOverlaysClickthroughWindow';

	public isOwEnabled(): boolean {
		try {
			return typeof overwolf !== 'undefined' && overwolf && overwolf.windows;
		} catch (e) {
			return false;
		}
	}

	public getMainWindow(): any {
		return this.isOwEnabled() ? overwolf.windows.getMainWindow() : null;
	}

	public getCollectionWindow(prefs: Preferences) {
		const windowName = this.getCollectionWindowName(prefs);
		return this.obtainDeclaredWindow(windowName);
	}

	public getBattlegroundsWindow(prefs: Preferences) {
		const windowName = this.getBattlegroundsWindowName(prefs);
		return this.obtainDeclaredWindow(windowName);
	}

	public getSettingsWindow(prefs: Preferences) {
		const windowName = this.getSettingsWindowName(prefs);
		return this.obtainDeclaredWindow(windowName);
	}

	public getCollectionWindowName(prefs: Preferences) {
		return prefs.collectionUseOverlay
			? OverwolfService.COLLECTION_WINDOW_OVERLAY
			: OverwolfService.COLLECTION_WINDOW;
	}

	public getBattlegroundsWindowName(prefs: Preferences) {
		return prefs.bgsUseOverlay
			? OverwolfService.BATTLEGROUNDS_WINDOW_OVERLAY
			: OverwolfService.BATTLEGROUNDS_WINDOW;
	}

	public getSettingsWindowName(prefs: Preferences) {
		return prefs.collectionUseOverlay ? OverwolfService.SETTINGS_WINDOW_OVERLAY : OverwolfService.SETTINGS_WINDOW;
	}

	public addStateChangedListener(targetWindowName: string, callback): (message: any) => void {
		const listener = (message) => {
			if (message.window_name !== targetWindowName && message.window_id !== targetWindowName) {
				return;
			}
			callback(message);
		};
		overwolf.windows.onStateChanged.addListener(listener);
		// So that it can be unsubscribed
		return listener;
	}

	public removeStateChangedListener(listener: (message: any) => void): void {
		overwolf.windows.onStateChanged.removeListener(listener);
	}

	public addAppLaunchTriggeredListener(callback) {
		overwolf.extensions.onAppLaunchTriggered.addListener(callback);
	}

	public addGameInfoUpdatedListener(callback: (message: any) => void): (message: any) => void {
		overwolf.games.onGameInfoUpdated.addListener(callback);
		return callback;
	}

	public removeGameInfoUpdatedListener(listener: (message: any) => void): void {
		overwolf.games.onGameInfoUpdated.removeListener(listener);
	}

	public addGameEventsErrorListener(callback) {
		overwolf.games.events.onError.addListener(callback);
	}

	public addGameEventInfoUpdates2Listener(callback) {
		overwolf.games.events.onInfoUpdates2.addListener(callback);
	}

	public addGameEventsListener(callback) {
		overwolf.games.events.onNewEvents.addListener(callback);
	}

	/** @deprecated Use event bus communication instead */
	public addMessageReceivedListener(callback: (message: any) => void): (message: any) => void {
		overwolf.windows.onMessageReceived.addListener(callback);
		return callback;
	}

	public removeMessageReceivedListener(listener: (message: any) => void): void {
		overwolf.windows.onMessageReceived.removeListener(listener);
	}

	public setWindowPassthrough(windowId: string): Promise<void> {
		return new Promise<void>((resolve) => {
			overwolf.windows.setWindowStyle(windowId, overwolf.windows.enums.WindowStyle.InputPassThrough, (data) => {
				resolve();
			});
		});
	}

	public addVideoCaptureSettingsChangedListener(callback: (message: any) => void): (message: any) => void {
		overwolf.settings.OnVideoCaptureSettingsChanged.addListener(callback);
		return callback;
	}

	public removeVideoCaptureSettingsChangedListener(listener: (message: any) => void): void {
		overwolf.settings.OnVideoCaptureSettingsChanged.removeListener(listener);
	}

	public addHotKeyPressedListener(hotkey: string, callback): any {
		// overwolf.settings.registerHotKey(hotkey, callback);
		overwolf.settings.hotkeys.onPressed.addListener((hotkeyPressed) => {
			if (hotkeyPressed?.name === hotkey) {
				callback();
			}
		});
	}

	public addHotKeyHoldListener(hotkey: string, onDown, onUp): (message: any) => void {
		// overwolf.settings.registerHotKey(hotkey, callback);
		const callback = (hotkeyHold) => {
			console.debug('hold', hotkeyHold);
			if (hotkeyHold?.name === hotkey) {
				if (hotkeyHold.state === 'down') {
					onDown();
				} else if (hotkeyHold.state === 'up') {
					onUp();
				}
			}
		};
		overwolf.settings.hotkeys.onHold.addListener(callback);
		return callback;
	}

	public removeHotKeyHoldListener(listener: (message: any) => void) {
		overwolf.settings.hotkeys.onHold.removeListener(listener);
	}

	public addHotkeyChangedListener(callback: (message: any) => void): (message: any) => void {
		const listener = (message) => {
			callback(message);
		};
		overwolf.settings.hotkeys.onChanged.addListener(listener);
		return listener;
	}

	public removeHotkeyChangedListener(listener: (message: any) => void): void {
		overwolf.settings.hotkeys.onChanged.removeListener(listener);
	}

	public addMouseUpListener(callback) {
		overwolf.games.inputTracking.onMouseUp.addListener(callback);
	}

	public addKeyDownListener(callback) {
		overwolf.games.inputTracking.onKeyDown.addListener(callback);
	}

	public addKeyUpListener(callback) {
		overwolf.games.inputTracking.onKeyUp.addListener(callback);
	}

	public addUncaughtExceptionHandler(handler) {
		overwolf.extensions.onUncaughtException.addListener(handler);
	}

	public openUrlInOverwolfBrowser(url) {
		overwolf.utils.openUrlInOverwolfBrowser(url);
	}

	public openUrlInDefaultBrowser(url: string) {
		overwolf.utils.openUrlInDefaultBrowser(url);
	}

	public addSessionInfoChangedLisetner(callback) {
		overwolf.egs.onSessionInfoChanged.addListener(callback);
	}

	public addMatchSelectionInfoChangedListener(callback) {
		overwolf.egs.onMatchSelectionChanged.addListener(callback);
	}

	public async getOpenWindows() {
		return new Promise<any>((resolve) => {
			overwolf.windows.getOpenWindows((res: any) => {
				resolve(res);
			});
		});
	}

	public async getWindowState(windowName: string) {
		return new Promise<any>((resolve) => {
			overwolf.windows.getWindowState(windowName, (res: any) => {
				resolve(res);
			});
		});
	}

	public async getWindowsStates() {
		return new Promise<any>((resolve) => {
			overwolf.windows.getWindowsStates((res: any) => {
				resolve(res);
			});
		});
	}

	public async getManifest(): Promise<Manifest> {
		return new Promise<Manifest>((resolve) => {
			overwolf.extensions.getManifest('lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob', (result) => {
				resolve(result);
			});
		});
	}
	public async getAppVersion(extensionId: string) {
		return new Promise<string>((resolve) => {
			overwolf.extensions.getManifest(extensionId, (result) => {
				resolve(result.meta.version);
			});
		});
	}

	public async getExtensionSettings(): Promise<any> {
		return new Promise<any>((resolve) => {
			overwolf.settings.getExtensionSettings((settings) => {
				resolve(settings);
			});
		});
	}

	public async getSelectedMatch(): Promise<{ gameId: number; matchId: string; sessionId: string }> {
		return new Promise<{ gameId: number; matchId: string; sessionId: string }>((resolve) => {
			overwolf.egs.getSelectedMatch((selectedMatchInfo) => {
				resolve(selectedMatchInfo);
			});
		});
	}

	public async getCurrentUser(): Promise<CurrentUser> {
		return new Promise<CurrentUser>((resolve) => {
			overwolf.profile.getCurrentUser((user) => {
				resolve(user);
			});
		});
	}

	public openLoginDialog() {
		overwolf.profile.openLoginDialog();
	}

	public addLoginStateChangedListener(callback) {
		overwolf.profile.onLoginStateChanged.addListener(callback);
	}

	public async closeWindow(windowId: string) {
		return new Promise<any>((resolve) => {
			overwolf.windows.close(windowId, (result) => {
				resolve(result);
			});
		});
	}

	/** @deprecated Use closeWindow instead */
	public async closeWindowFromName(windowName: string) {
		const window = await this.obtainDeclaredWindow(windowName);
		return new Promise<any>((resolve) => {
			overwolf.windows.close(window.id, (result) => {
				resolve(result);
			});
		});
	}

	public async restoreWindow(windowId: string) {
		return new Promise<any>((resolve) => {
			try {
				overwolf.windows.restore(windowId, async (result) => {
					resolve(result);
				});
			} catch (e) {
				// This doesn't seem to prevent the window from being restored, so let's ignore it
				console.warn('Exception while restoring window', e);
				resolve(null);
			}
		});
	}

	public async setTopmost(windowId: string) {
		return new Promise<any>((resolve) => {
			try {
				overwolf.windows.setTopmost(windowId, true, (result) => {
					resolve(result);
				});
			} catch (e) {
				console.warn('exception when setting topmost', windowId, e);
				resolve(null);
			}
		});
	}

	public async bringToFront(windowId: string, grabFocus = false) {
		return new Promise<any>((resolve) => {
			// https://overwolf.github.io/docs/api/overwolf-windows#setdesktoponlywindowid-shouldbedesktoponly-callback
			try {
				overwolf.windows.bringToFront(windowId, grabFocus, (result) => {
					console.debug('brought to front', result);
					resolve(result);
				});
			} catch (e) {
				console.warn('exception when bringing to front', windowId, e);
				resolve(null);
			}
		});
	}

	public async sendToBack(windowId: string) {
		return new Promise<any>((resolve) => {
			try {
				overwolf.windows.sendToBack(windowId, false, (result) => {
					resolve(result);
				});
			} catch (e) {
				console.warn('exception when sending to back', windowId, e);
				resolve(null);
			}
		});
	}

	public async hideWindow(windowId: string) {
		return new Promise<any>((resolve) => {
			try {
				overwolf.windows.hide(windowId, (result) => {
					resolve(result);
				});
			} catch (e) {
				// This doesn't seem to prevent the window from being restored, so let's ignore it
				console.warn('Exception while hiding window', e);
				resolve(null);
			}
		});
	}

	public async hideCollectionWindow(prefs: Preferences): Promise<void> {
		const collectionWindow = await this.getCollectionWindow(prefs);
		const settingsWindow = await this.getSettingsWindow(prefs);
		return new Promise<void>(async (resolve) => {
			await Promise.all([this.hideWindow(collectionWindow.id), this.hideWindow(settingsWindow.id)]);
			resolve();
		});
	}

	public minimizeWindow(windowId: string) {
		return new Promise<any>((resolve) => {
			overwolf.windows.minimize(windowId, (result) => {
				resolve(result);
			});
		});
	}

	public maximizeWindow(windowId: string) {
		return new Promise<any>((resolve) => {
			overwolf.windows.maximize(windowId, (result) => {
				resolve(result);
			});
		});
	}

	public async dragMove(windowId: string) {
		return new Promise<void>((resolve) => {
			overwolf.windows.dragMove(windowId, () => {
				resolve();
			});
		});
	}

	public async dragResize(windowId: string, edge: string) {
		return new Promise<void>((resolve) => {
			overwolf.windows.dragResize(windowId, edge, null, (result) => {
				resolve(result);
			});
		});
	}

	public async inGame(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			overwolf.games.getRunningGameInfo((res: any) => {
				if (this.gameRunning(res)) {
					resolve(true);
				}
				resolve(false);
			});
		});
	}

	public inAnotherGame(gameInfoResult: any): boolean {
		return (
			gameInfoResult &&
			gameInfoResult.gameInfo &&
			gameInfoResult.gameInfo.isRunning &&
			Math.floor(gameInfoResult.gameInfo.id / 10) !== HEARTHSTONE_GAME_ID
		);
	}

	public exitGame(gameInfoResult: any): boolean {
		return (
			!gameInfoResult ||
			!gameInfoResult.gameInfo ||
			!gameInfoResult.gameInfo.isRunning ||
			Math.floor(gameInfoResult.gameInfo.id / 10) !== HEARTHSTONE_GAME_ID
		);
	}

	public async getRunningGameInfo() {
		return new Promise<any>((resolve) => {
			try {
				overwolf.games.getRunningGameInfo((res: any) => {
					resolve(res);
				});
			} catch (e) {
				// This doesn't seem to prevent the window from being restored, so let's ignore it
				console.warn('Exception while getting running game info', e);
				resolve(null);
			}
		});
	}

	public async getSessionInfo() {
		return new Promise<any>((resolve) => {
			overwolf.egs.getSessionInfo((res: any) => {
				resolve(res);
			});
		});
	}

	public async getGameEventsInfo() {
		return new Promise<any>((resolve) => {
			overwolf.games.events.getInfo((info: any) => {
				resolve(info);
			});
		});
	}

	public async setGameEventsRequiredFeatures(features) {
		return new Promise<any>((resolve) => {
			overwolf.games.events.setRequiredFeatures(features, (info) => {
				resolve(info);
			});
		});
	}

	public async getHotKey(hotkeyName: string) {
		return new Promise<any>((resolve) => {
			overwolf.settings.hotkeys.get((res: any) => {
				const game: any[] = res.games[HEARTHSTONE_GAME_ID];
				const hotkey = game?.find((key: any) => key.name === hotkeyName);
				resolve(hotkey);
			});
		});
	}

	public async setVideoCaptureSettings(resolution: string, fps: number): Promise<any> {
		return new Promise<boolean>((resolve) => {
			overwolf.settings.setVideoCaptureSettings(resolution, fps, (res: any) => {
				resolve(res);
			});
		});
	}

	public async getVideoCaptureSettings(): Promise<any> {
		return new Promise<boolean>((resolve) => {
			overwolf.settings.getVideoCaptureSettings((res: any) => {
				resolve(res);
			});
		});
	}

	public async setAudioCaptureSettings(captureSystemSound: boolean, captureMicrophoneSound: boolean): Promise<any> {
		return new Promise<boolean>((resolve) => {
			overwolf.settings.setAudioCaptureSettings(captureSystemSound, captureMicrophoneSound, (res: any) => {
				resolve(res);
			});
		});
	}

	public async getAudioCaptureSettings(): Promise<any> {
		return new Promise<boolean>((resolve) => {
			overwolf.settings.getAudioCaptureSettings((res: any) => {
				resolve(res);
			});
		});
	}

	public async sendMessageWithName(windowName: string, messageType: string, messageBody?: string): Promise<void> {
		const window = await this.obtainDeclaredWindow(windowName);
		return new Promise<void>((resolve) => {
			overwolf.windows.sendMessage(window.id, messageType, messageBody, () => {
				resolve();
			});
		});
	}

	public async sendMessage(windowId: string, messageType: string, messageBody?: any): Promise<void> {
		return new Promise<void>((resolve) => {
			overwolf.windows.sendMessage(windowId, messageType, messageBody, () => {
				resolve();
			});
		});
	}

	public async obtainDeclaredWindow(windowName: string): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			overwolf.windows.obtainDeclaredWindow(windowName, (res: any) => {
				if (res.status === 'success') {
					resolve(res.window);
				} else {
					resolve(res);
				}
			});
		});
	}

	public async getCurrentWindow(): Promise<any> {
		return new Promise<any>((resolve) => {
			try {
				overwolf.windows.getCurrentWindow((res: any) => {
					resolve(res.window);
				});
			} catch (e) {
				console.warn('Exception while getting current window window');
				resolve(null);
			}
		});
	}

	public async getAppVideoCaptureFolderSize(): Promise<any> {
		return new Promise<boolean>((resolve) => {
			overwolf.media.getAppVideoCaptureFolderSize((res: any) => {
				resolve(res);
			});
		});
	}

	public async getOverwolfVideosFolder(): Promise<any> {
		return new Promise<boolean>((resolve) => {
			overwolf.settings.getOverwolfVideosFolder((res: any) => {
				resolve(res);
			});
		});
	}

	public async openWindowsExplorer(path: string): Promise<any> {
		return new Promise<boolean>((resolve) => {
			overwolf.utils.openWindowsExplorer(path, (res: any) => {
				resolve(res);
			});
		});
	}

	public async changeWindowPosition(windowId: string, newX: number, newY: number): Promise<void> {
		return new Promise<void>((resolve) => {
			try {
				console.debug('changing', Math.round(newX), Math.round(newY));
				overwolf.windows.changePosition(windowId, Math.round(newX), Math.round(newY), (res) => {
					console.debug('change res', res);
					resolve();
				});
			} catch (e) {
				console.error('Exception while trying to changePosition', windowId, newX, newY, e);
				resolve();
			}
		});
	}

	public async changeWindowSize(windowId: string, width: number, height: number): Promise<void> {
		return new Promise<void>((resolve) => {
			try {
				overwolf.windows.changeSize(windowId, Math.round(width), Math.round(height), (res) => {
					console.debug('resize res', res);
					resolve();
				});
			} catch (e) {
				console.error('Exception while trying to changeSize', windowId, width, height, e);
				resolve();
			}
		});
	}

	public async turnOnReplays(settings): Promise<void> {
		return new Promise<any>((resolve) => {
			overwolf.media.replays.turnOn(settings, (result) => {
				resolve(result);
			});
		});
	}

	public async turnOffReplays(): Promise<void> {
		return new Promise<void>((resolve) => {
			overwolf.media.replays.turnOff((res: any) => {
				resolve();
			});
		});
	}

	public async startReplayCapture(captureDuration: number): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			overwolf.media.replays.startCapture(captureDuration, (status) => {
				if (status === 'error') {
					console.warn('[overwolf-service] could not start capture', status);
					reject(status);
				} else {
					resolve(status);
				}
			});
		});
	}

	public async stopReplayCapture(replayId: string): Promise<any> {
		return new Promise<any>((resolve) => {
			overwolf.media.replays.stopCapture(replayId, (result) => {
				resolve(result);
			});
		});
	}

	public async getReplayMediaState(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			overwolf.media.replays.getState((res: any) => {
				resolve(res.isOn);
			});
		});
	}

	public async isGSEnabled(): Promise<any> {
		return new Promise<any>((resolve) => {
			overwolf.egs.isEnabled((egsEnabledResult: any) => {
				resolve(egsEnabledResult);
			});
		});
	}

	public async requestGSDisplay(): Promise<any> {
		return new Promise<any>((resolve) => {
			overwolf.egs.requestToDisplay((displayRequestResult: any) => {
				resolve(displayRequestResult);
			});
		});
	}

	public async getExtensionInfo(extensionId: string): Promise<any> {
		return new Promise<any>((resolve) => {
			overwolf.extensions.getInfo('nafihghfcpikebhfhdhljejkcifgbdahdhngepfb', (callbackInfo) => {
				resolve(callbackInfo);
			});
		});
	}

	public async setExtensionInfo(info): Promise<void> {
		return new Promise<void>((resolve) => {
			overwolf.extensions.setInfo(info);
			resolve();
		});
	}

	public async registerInfo(id: string, eventsCallback): Promise<void> {
		return new Promise<void>((resolve) => {
			overwolf.extensions.registerInfo(id, eventsCallback, () => {
				resolve();
			});
		});
	}

	public async setShelfStatusReady(): Promise<void> {
		return new Promise<void>((resolve) => {
			if (!overwolf || !overwolf.egs || !overwolf.egs.setStatus) {
				setTimeout(() => {
					this.setShelfStatusReady();
				}, 100);
				return;
			}

			// Start loading the shelf page
			overwolf.egs.setStatus(overwolf.egs.enums.ShelfStatus.Ready, (result: any) => {
				resolve();
			});
		});
	}

	public setZoom(zoomFactor: number) {
		overwolf.windows.setZoom(zoomFactor);
	}

	public async getActiveSubscriptionPlans(): Promise<ActiveSubscriptionPlan> {
		return new Promise<ActiveSubscriptionPlan>((resolve) => {
			if (!overwolf.profile.subscriptions) {
				resolve({} as ActiveSubscriptionPlan);
				return;
			}
			overwolf.profile.subscriptions.getActivePlans((res: ActiveSubscriptionPlan) => {
				resolve(res);
			});
		});
	}

	public async shouldShowAds(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			if (!overwolf.profile.subscriptions) {
				resolve(true);
				return;
			}
			overwolf.profile.subscriptions.getActivePlans((activePlans: ActiveSubscriptionPlan) => {
				const hideAds = activePlans && activePlans.plans && activePlans.plans.includes(NO_AD_PLAN);
				resolve(!hideAds);
			});
		});
	}

	private twitterUserInfo: TwitterUserInfo = null;

	public addTwitterLoginStateChangedListener(callback) {
		overwolf.social.twitter.onLoginStateChanged.addListener(async (result) => {
			callback(result);
			this.twitterUserInfo = await this.getTwitterUserInfo(true);
		});
	}

	public async getTwitterUserInfo(forceRefresh = false): Promise<TwitterUserInfo> {
		if (!forceRefresh && this.twitterUserInfo && this.twitterUserInfo.id) {
			return this.twitterUserInfo;
		}
		return new Promise<TwitterUserInfo>((resolve) => {
			overwolf.social.twitter.getUserInfo((res) => {
				if (res.status !== 'success' || !res.userInfo) {
					const result: TwitterUserInfo = {
						network: 'twitter',
						avatarUrl: undefined,
						id: undefined,
						name: undefined,
						screenName: undefined,
					};
					this.twitterUserInfo = result;
					resolve(result);
					return;
				}
				const result: TwitterUserInfo = {
					network: 'twitter',
					avatarUrl: res.userInfo.avatar,
					id: res.userInfo.id,
					name: res.userInfo.name,
					screenName: res.userInfo.screenName,
				};
				this.twitterUserInfo = result;
				resolve(result);
			});
		});
	}

	public async twitterShare(filePathOnDisk: string, message: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			const shareParam = {
				file: filePathOnDisk,
				message: message,
			};
			overwolf.social.twitter.share(shareParam, (res, error) => {
				resolve(res);
			});
		});
	}

	public async twitterLogin() {
		overwolf.social.twitter.performUserLogin();
	}

	public async twitterLogout() {
		return new Promise<void>((resolve) => {
			overwolf.social.twitter.performLogout((info) => {
				this.twitterUserInfo = null;
				resolve(info);
			});
		});
	}

	private redditUserInfo: RedditUserInfo = null;

	public addRedditLoginStateChangedListener(callback) {
		overwolf.social.reddit.onLoginStateChanged.addListener(async (result) => {
			callback(result);
			this.redditUserInfo = await this.getRedditUserInfo(true);
		});
	}

	public async getRedditUserInfo(forceRefresh = false): Promise<RedditUserInfo> {
		if (!forceRefresh && this.redditUserInfo && this.redditUserInfo.id) {
			return this.redditUserInfo;
		}
		return new Promise<RedditUserInfo>((resolve) => {
			overwolf.social.reddit.getUserInfo((res) => {
				if (res.status !== 'success' || !res.userInfo) {
					const result: RedditUserInfo = {
						network: 'reddit',
						avatarUrl: undefined,
						id: undefined,
						name: undefined,
						screenName: undefined,
					};
					this.redditUserInfo = result;
					resolve(result);
					return;
				}
				const result: RedditUserInfo = {
					network: 'reddit',
					avatarUrl: res.userInfo.avatar,
					id: res.userInfo.name,
					name: res.userInfo.name,
					screenName: res.userInfo.displayName,
				};
				this.redditUserInfo = result;
				resolve(result);
			});
		});
	}

	public async getSubredditFlairs(subreddit: string): Promise<readonly Flair[]> {
		return new Promise<readonly Flair[]>((resolve) => {
			overwolf.social.reddit.getSubredditFlairs(subreddit, (res, error) => {
				resolve(res?.flairs);
			});
		});
	}

	public async redditShare(
		filePathOnDisk: string,
		message: string,
		subreddit: string,
		flair?: string,
	): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			const shareParam = {
				file: filePathOnDisk,
				title: message,
				subreddit: subreddit,
				flair_id: flair,
			};
			overwolf.social.reddit.share(shareParam, (res, error) => {
				resolve(res);
			});
		});
	}

	public async redditLogin() {
		overwolf.social.reddit.performUserLogin();
	}

	public async redditLogout() {
		return new Promise<void>((resolve) => {
			overwolf.social.reddit.performLogout((info) => {
				this.redditUserInfo = null;
				resolve(info);
			});
		});
	}

	public async listFilesInAppDirectory(appName: string): Promise<any> {
		return new Promise<any>((resolve) => {
			overwolf.io.dir(`${overwolf.io.paths.localAppData}/overwolf/Log/Apps/${appName}`, (res) => {
				resolve(res);
			});
		});
	}

	public async fileExists(filePathOnDisk: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			overwolf.io.fileExists(filePathOnDisk, (res, error) => {
				resolve(res.found);
			});
		});
	}

	public async writeFileContents(filePathOnDisk: string, content: string): Promise<string> {
		return new Promise<string>((resolve) => {
			overwolf.io.writeFileContents(filePathOnDisk, content, 'UTF8', false, (res, error) => {
				resolve(res.success ? res.content : null);
			});
		});
	}

	public async readTextFile(filePathOnDisk: string): Promise<string> {
		return new Promise<string>((resolve) => {
			overwolf.io.readTextFile(filePathOnDisk, { encoding: 'UTF8' }, (res, error) => {
				resolve(res.success ? res.content : null);
			});
		});
	}

	public async deleteFile(filePathOnDisk: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			overwolf.io.writeFileContents(filePathOnDisk, '', 'UTF8', false, (res, error) => {
				resolve(res.status === 'success');
			});
		});
	}

	public openStore() {
		overwolf.utils.openStore({
			page: overwolf.utils.enums.eStorePage.SubscriptionPage,
		});
	}

	public async getFromClipboard(): Promise<string> {
		return new Promise<string>((resolve) => {
			overwolf.utils.getFromClipboard((res, error) => {
				resolve(res);
			});
		});
	}

	public async placeOnClipboard(value: string): Promise<void> {
		return new Promise<void>((resolve) => {
			overwolf.utils.placeOnClipboard(value);
			resolve();
		});
	}

	public async getMonitorsList(): Promise<any> {
		return new Promise<any>((resolve) => {
			overwolf.utils.getMonitorsList((res) => {
				resolve(res);
			});
		});
	}

	public async getSystemInformation(): Promise<any> {
		return new Promise<any>((resolve) => {
			overwolf.utils.getSystemInformation((res) => {
				resolve(res.systemInfo);
			});
		});
	}

	public listenOnFile(id: string, path: string, options: any, callback: (lineInfo: ListenObject) => any) {
		overwolf.io.listenOnFile(id, path, !!options ? { ...options, encoding: 'UTF8' } : null, callback);
	}

	public stopFileListener(id: string) {
		console.log('[ow-service] stopping file listener', id);
		overwolf.io.stopFileListener(id);
	}

	public checkForExtensionUpdate(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			overwolf.extensions.checkForExtensionUpdate((res: CheckForUpdateResult) => {
				resolve(res.updateVersion != null);
			});
		});
	}

	public updateExtension(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			overwolf.extensions.updateExtension((res: UpdateExtensionResult) => {
				resolve(!res.error);
			});
		});
	}

	public relaunchApp() {
		overwolf.extensions.relaunch();
	}

	public gameRunning(gameInfo: any): boolean {
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
		return true;
	}

	public gameLaunched(gameInfoResult: any): boolean {
		if (!gameInfoResult) {
			return false;
		}
		if (!gameInfoResult.gameInfo) {
			return false;
		}
		if (!gameInfoResult.gameInfo.isRunning) {
			return false;
		}
		// NOTE: we divide by 10 to get the game class id without it's sequence number
		if (Math.floor(gameInfoResult.gameInfo.id / 10) !== HEARTHSTONE_GAME_ID) {
			return false;
		}
		// Only detect new game launched events when it goes from not running to running
		return gameInfoResult.runningChanged || gameInfoResult.gameChanged;
	}

	public async setTrayMenu(menu: overwolf.os.tray.ExtensionTrayMenu): Promise<void> {
		return new Promise<void>((resolve) => {
			overwolf.os.tray.setMenu(menu, (result) => {
				console.debug('[ow] setTrayMenu', result);
				resolve();
			});
		});
	}

	public onTrayMenuClicked(callback: (event: overwolf.os.tray.onMenuItemClickedEvent) => void): void {
		overwolf.os.tray.onMenuItemClicked.addListener(callback);
	}

	public static getAppFolder(): string {
		return `${overwolf.io.paths.localAppData}/overwolf/Log/Apps/Firestone`;
	}

	public static getLocalAppDataFolder(): string {
		return `${overwolf.io.paths.localAppData}`;
	}
}

export interface ListenObject {
	readonly success: boolean;
	readonly error: string;
	readonly state: 'running' | 'terminated' | 'truncated';
	readonly content: string;
	readonly info: string;
}

export interface Flair {
	readonly id: string;
	readonly text: string;
	readonly mod_only: boolean;
	readonly allowable_content: string;
}

interface CheckForUpdateResult {
	readonly success: boolean;
	readonly error: string;
	readonly state: ExtensionUpdateState;
	readonly updateVersion: string;
}

type ExtensionUpdateState = 'UpToDate' | 'UpdateAvailable' | 'PendingRestart';

interface UpdateExtensionResult {
	readonly success: boolean;
	readonly error: string;
	readonly state: string;
	readonly info: string;
	readonly version: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Manifest {
	data: {
		windows: {
			[windowName: string]: {
				min_size: {
					width: number;
					height: number;
				};
			};
		};
	};
}
