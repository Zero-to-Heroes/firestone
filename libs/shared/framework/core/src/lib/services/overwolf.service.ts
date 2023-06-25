/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';

// import '@overwolf/types';

const HEARTHSTONE_GAME_ID = 9898;
const NO_AD_PLAN = 13;

// TODO: move types
type Preferences = any;
type TwitterUserInfo = any;
type RedditUserInfo = any;

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
	public static LOTTERY_WINDOW = 'LotteryWindow';

	private twitterUserInfo: TwitterUserInfo;
	private redditUserInfo: RedditUserInfo = null;

	public static getAppFolder(): string {
		return `${overwolf.io.paths.localAppData}/overwolf/Log/Apps/Firestone`;
	}

	public static getLocalAppDataFolder(): string {
		return `${overwolf.io.paths.localAppData}`;
	}

	public isOwEnabled(): boolean {
		try {
			return typeof overwolf !== 'undefined' && !!overwolf?.windows;
		} catch (e) {
			return false;
		}
	}

	public getMainWindow(): any {
		// When dealing with the website / SPA without overwolf, the main window is simply the current window (since there is only one window)
		return this.isOwEnabled() ? overwolf.windows.getMainWindow() : window;
	}

	// TODO: move preferences to a common module
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

	public addGameInfoUpdatedListener(
		callback: (message: overwolf.games.GameInfoUpdatedEvent) => void,
	): (message: overwolf.games.GameInfoUpdatedEvent) => void {
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

	public async getManifest(): Promise<overwolf.extensions.GetManifestResult> {
		return new Promise<overwolf.extensions.GetManifestResult>((resolve) => {
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

	public async getCurrentUser(): Promise<overwolf.profile.GetCurrentUserResult> {
		return new Promise<overwolf.profile.GetCurrentUserResult>((resolve) => {
			overwolf.profile.getCurrentUser((user) => {
				resolve(user);
			});
		});
	}

	public async generateSessionToken(): Promise<string> {
		return new Promise<string>((resolve) => {
			overwolf.profile.generateUserSessionToken((result) => {
				if (!result.success) {
					console.error('could not generate user session token', result.error);
				}
				resolve(result.token);
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

	public async restoreWindow(windowId: string): Promise<overwolf.windows.WindowIdResult | null> {
		return new Promise<overwolf.windows.WindowIdResult | null>((resolve) => {
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

	public async bringToFront(windowId: string, grabFocus = false): Promise<overwolf.windows.WindowIdResult | null> {
		return new Promise<overwolf.windows.WindowIdResult | null>((resolve) => {
			// https://overwolf.github.io/docs/api/overwolf-windows#setdesktoponlywindowid-shouldbedesktoponly-callback
			try {
				overwolf.windows.bringToFront(windowId, grabFocus, (result) => {
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
				overwolf.windows.sendToBack(windowId, (result) => resolve(result));
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
		// eslint-disable-next-line no-async-promise-executor
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

	public async dragResize(windowId: string, edge: overwolf.windows.enums.WindowDragEdge) {
		return new Promise<overwolf.windows.DragResizeResult>((resolve) => {
			overwolf.windows.dragResize(windowId, edge, null as any, (result) => {
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
		return new Promise<overwolf.games.GetRunningGameInfoResult>((resolve) => {
			try {
				overwolf.games.getRunningGameInfo((res: overwolf.games.GetRunningGameInfoResult) => {
					resolve(res);
				});
			} catch (e) {
				// This doesn't seem to prevent the window from being restored, so let's ignore it
				console.warn('Exception while getting running game info', e);
				resolve(null as any);
			}
		});
	}

	public async getGameEventsInfo() {
		return new Promise<any>((resolve) => {
			overwolf.games.events.getInfo((info: any) => {
				resolve(info);
			});
		});
	}

	public async getGameDbInfo() {
		return new Promise<overwolf.games.GetGameDBInfoResult>((resolve) => {
			overwolf.games.getGameDBInfo(HEARTHSTONE_GAME_ID, (info: overwolf.games.GetGameDBInfoResult) => {
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

	public async setVideoCaptureSettings(
		resolution: overwolf.settings.enums.ResolutionSettings,
		fps: number,
	): Promise<any> {
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

	public async obtainDeclaredWindow(windowName: string): Promise<overwolf.windows.WindowInfo> {
		return new Promise<overwolf.windows.WindowInfo>((resolve, reject) => {
			overwolf.windows.obtainDeclaredWindow(windowName, (res) => {
				if (res.success) {
					resolve(res.window);
				}
			});
		});
	}

	public async getCurrentWindow(): Promise<ExtendedWindowInfo> {
		return new Promise<ExtendedWindowInfo>((resolve) => {
			try {
				overwolf.windows.getCurrentWindow((res: overwolf.windows.WindowResult) => {
					resolve(res.window as ExtendedWindowInfo);
				});
			} catch (e) {
				console.warn('Exception while getting current window window');
				resolve(null as any);
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
				overwolf.windows.changePosition(windowId, Math.round(newX), Math.round(newY), (res) => {
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
					resolve();
				});
			} catch (e) {
				console.error('Exception while trying to changeSize', windowId, width, height, e);
				resolve();
			}
		});
	}

	public async changeWindowSize2(windowId: string, width: number, height: number): Promise<void> {
		return new Promise<void>((resolve) => {
			try {
				overwolf.windows.changeSize(
					{
						window_id: windowId,
						width: Math.round(width),
						height: Math.round(height),
					},
					(res) => {
						resolve();
					},
				);
			} catch (e) {
				console.error('Exception while trying to changeSize', windowId, width, height, e);
				resolve();
			}
		});
	}

	public setZoom(zoomFactor: number) {
		overwolf.windows.setZoom(zoomFactor, null as any);
	}

	public async getActiveSubscriptionPlans(): Promise<overwolf.profile.subscriptions.GetActivePlansResult> {
		return new Promise<overwolf.profile.subscriptions.GetActivePlansResult>((resolve) => {
			if (!overwolf.profile.subscriptions) {
				resolve({} as overwolf.profile.subscriptions.GetActivePlansResult);
				return;
			}
			overwolf.profile.subscriptions.getActivePlans(
				(res: overwolf.profile.subscriptions.GetActivePlansResult) => {
					resolve(res);
				},
			);
		});
	}

	public async onSubscriptionChanged(
		listener: (event: overwolf.profile.subscriptions.SubscriptionChangedEvent) => void,
	) {
		overwolf.profile.subscriptions.onSubscriptionChanged.addListener(listener);
	}

	public async shouldShowAds(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			if (!overwolf.profile.subscriptions) {
				resolve(true);
				return;
			}
			overwolf.profile.subscriptions.getActivePlans(
				(activePlans: overwolf.profile.subscriptions.GetActivePlansResult) => {
					const hideAds = activePlans && activePlans.plans && activePlans.plans.includes(NO_AD_PLAN);
					resolve(!hideAds);
				},
			);
		});
	}

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
				if (!res?.success || !res.userInfo) {
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

	public async twitterShare(filePathOnDisk: string, message: string): Promise<void> {
		return new Promise<void>((resolve) => {
			const shareParam: overwolf.social.twitter.ShareParameters = {
				file: filePathOnDisk,
				message: message,
				useOverwolfNotifications: false,
			};
			overwolf.social.twitter.share(shareParam, (res) => {
				resolve();
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
				resolve();
			});
		});
	}

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
				if (!res.success || !res.userInfo) {
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
			overwolf.social.reddit.getSubredditFlairs(subreddit, (res) => {
				resolve((res as any)?.flairs);
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
			const shareParam: overwolf.social.reddit.ShareParameters = {
				file: filePathOnDisk,
				title: message,
				subreddit: subreddit,
				flair_id: {
					id: flair,
				} as Flair,
				useOverwolfNotifications: false,
				description: '',
			};
			overwolf.social.reddit.share(shareParam, (res) => {
				resolve(res?.success);
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
				resolve();
			});
		});
	}

	public async listFilesInAppDirectory(appName: string): Promise<overwolf.io.DirResult & { path?: string }> {
		return this.listFilesInDirectory(`${overwolf.io.paths.localAppData}/overwolf/Log/Apps/${appName}`);
	}

	public async listFilesInOverwolfDirectory(): Promise<overwolf.io.DirResult & { path?: string }> {
		return this.listFilesInDirectory(`${overwolf.io.paths.localAppData}/overwolf/Log`);
	}

	public async listFilesInDirectory(directory: string): Promise<overwolf.io.DirResult & { path?: string }> {
		return new Promise<overwolf.io.DirResult & { path?: string }>((resolve) => {
			overwolf.io.dir(directory, (res) => {
				resolve(res);
			});
		});
	}

	public async fileExists(filePathOnDisk: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			overwolf.io.fileExists(filePathOnDisk, (res) => {
				resolve(res.found as boolean);
			});
		});
	}

	public async writeFileContents(filePathOnDisk: string, content: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			overwolf.io.writeFileContents(filePathOnDisk, content, overwolf.io.enums.eEncoding.UTF8, false, (res) => {
				resolve(res?.success);
			});
		});
	}

	public async readTextFile(filePathOnDisk: string): Promise<string> {
		return new Promise<string>((resolve) => {
			overwolf.io.readTextFile(
				filePathOnDisk,
				{ encoding: overwolf.io.enums.eEncoding.UTF8, maxBytesToRead: null as any, offset: null as any },
				(res) => {
					resolve((res.success ? res.content : null) as string);
				},
			);
		});
	}

	public async storeAppFile(fileName: string, content: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			overwolf.extensions.io.writeTextFile(
				overwolf.extensions.io.enums.StorageSpace.appData,
				fileName,
				content,
				(res) => {
					resolve(res?.success);
				},
			);
		});
	}

	public async readAppFile(fileName: string): Promise<string | null> {
		return new Promise<string | null>((resolve) => {
			overwolf.extensions.io.readTextFile(overwolf.extensions.io.enums.StorageSpace.appData, fileName, (res) => {
				resolve(res?.success ? res.content : null);
			});
		});
	}

	public async deleteAppFile(fileName: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			overwolf.extensions.io.delete(overwolf.extensions.io.enums.StorageSpace.appData, fileName, (res) => {
				console.debug('[overwolf-utils] deleted app file', fileName, res);
				resolve(res.success);
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
			overwolf.utils.getFromClipboard((res) => {
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

	public async getMonitorsList(): Promise<overwolf.utils.getMonitorsListResult> {
		return new Promise<overwolf.utils.getMonitorsListResult>((resolve) => {
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
		overwolf.io.listenOnFile(id, path, !!options ? { ...options, encoding: 'UTF8' } : null, callback as any);
	}

	public stopFileListener(id: string) {
		console.log('[ow-service] stopping file listener', id);
		overwolf.io.stopFileListener(id);
	}

	public checkForExtensionUpdate(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			overwolf.extensions.checkForExtensionUpdate((res: any) => {
				resolve(res.updateVersion != null);
			});
		});
	}

	public updateExtension(): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			overwolf.extensions.updateExtension((res: any) => {
				console.log('[app-update] update result', res);
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
				resolve();
			});
		});
	}

	public onTrayMenuClicked(callback: (event: overwolf.os.tray.onMenuItemClickedEvent) => void): void {
		overwolf.os.tray.onMenuItemClicked.addListener(callback);
	}

	public async isWindowVisibleToUser(): Promise<'hidden' | 'full' | 'partial'> {
		return new Promise<'hidden' | 'full' | 'partial'>((resolve) => {
			overwolf.windows.isWindowVisibleToUser((result) => {
				resolve(result.visible);
			});
		});
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

export interface ExtendedWindowInfo extends overwolf.windows.WindowInfo {
	dpiScale: number;
	type: 'Deskopt' | string;
}
