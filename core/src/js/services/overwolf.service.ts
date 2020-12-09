import { Injectable } from '@angular/core';
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
	public static DECKTRACKER_WINDOW = 'DeckTrackerWindow';
	public static DECKTRACKER_OPPONENT_WINDOW = 'DeckTrackerOpponentWindow';
	public static NOTIFICATIONS_WINDOW = 'NotificationsWindow';
	public static MATCH_OVERLAY_OPPONENT_HAND_WINDOW = 'MatchOverlayOpponentHandWindow';
	public static SECRETS_HELPER_WINDOW = 'SecretsHelperWindow';
	public static BATTLEGROUNDS_WINDOW = 'BattlegroundsWindow';
	public static BATTLEGROUNDS_WINDOW_OVERLAY = 'BattlegroundsOverlayWindow';
	public static BATTLEGROUNDS_BATTLE_SIMULATION_WINDOW_OVERLAY = 'BgsBattleSimulationOverlay';
	public static BATTLEGROUNDS_BANNED_TRIBES_WINDOW = 'BgsBannedTribes';
	public static COUNTER_PLAYER_GALAKROND_WINDOW = 'CounterPlayerGalakrond';
	public static COUNTER_OPPONENT_GALAKROND_WINDOW = 'CounterOpponentGalakrond';
	public static COUNTER_PLAYER_POGO_WINDOW = 'CounterPlayerPogo';
	public static COUNTER_PLAYER_JADE_WINDOW = 'CounterPlayerJadeGolem';
	public static COUNTER_OPPONENT_POGO_WINDOW = 'CounterOpponentPogo';
	public static COUNTER_OPPONENT_JADE_WINDOW = 'CounterOpponentJadeGolem';
	public static COUNTER_PLAYER_CTHUN_WINDOW = 'CounterPlayerCthun';
	public static COUNTER_OPPONENT_CTHUN_WINDOW = 'CounterOpponentCthun';
	public static COUNTER_PLAYER_FATIGUE_WINDOW = 'CounterPlayerFatigue';
	public static COUNTER_OPPONENT_FATIGUE_WINDOW = 'CounterOpponentFatigue';
	public static COUNTER_PLAYER_ATTACK_WINDOW = 'CounterPlayerAttack';
	public static COUNTER_OPPONENT_ATTACK_WINDOW = 'CounterOpponentAttack';
	public static COUNTER_PLAYER_SPELL_WINDOW = 'CounterPlayerSpells';
	public static BGS_COUNTER_PLAYER_POGO_WINDOW = 'BgsCounterPlayerPogo';

	public isOwEnabled(): boolean {
		try {
			return overwolf && overwolf.windows;
		} catch (e) {
			return false;
		}
	}

	public getMainWindow(): any {
		return overwolf.windows.getMainWindow();
	}

	public getCollectionWindow(prefs: Preferences) {
		const windowName = this.getCollectionWindowName(prefs);
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
		const listener = message => {
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

	public addMessageReceivedListener(callback: (message: any) => void): (message: any) => void {
		overwolf.windows.onMessageReceived.addListener(callback);
		return callback;
	}

	public removeMessageReceivedListener(listener: (message: any) => void): void {
		overwolf.windows.onMessageReceived.removeListener(listener);
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
		overwolf.settings.hotkeys.onPressed.addListener(hotkeyPressed => {
			if (hotkeyPressed?.name === hotkey) {
				callback();
			}
			// console.log('hotkey pressed', hotkeyPressed)
		});
	}

	public addHotkeyChangedListener(callback: (message: any) => void): (message: any) => void {
		// console.log('register hotkey change listener');
		const listener = message => {
			console.log('got hotkey change message', message);
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
		return new Promise<any>(resolve => {
			overwolf.windows.getOpenWindows((res: any) => {
				// console.log('[overwolf-service] retrieve all open windows', res);
				resolve(res);
			});
		});
	}

	public async getWindowState(windowName: string) {
		return new Promise<any>(resolve => {
			overwolf.windows.getWindowState(windowName, (res: any) => {
				// console.log('[overwolf-service] retrieve window states', res);
				resolve(res);
			});
		});
	}

	public async getWindowsStates() {
		return new Promise<any>(resolve => {
			overwolf.windows.getWindowsStates((res: any) => {
				// console.log('[overwolf-service] retrieve all windows states', res);
				resolve(res);
			});
		});
	}

	// Careful, this only returns the version, not the full manifest
	public async getManifest(extensionId: string) {
		return new Promise<string>(resolve => {
			overwolf.extensions.getManifest(extensionId, result => {
				resolve(result.meta.version);
			});
		});
	}

	public async getSelectedMatch(): Promise<{ gameId: number; matchId: string; sessionId: string }> {
		return new Promise<{ gameId: number; matchId: string; sessionId: string }>(resolve => {
			overwolf.egs.getSelectedMatch(selectedMatchInfo => {
				console.log('[overwolf-service] retrieve match from API', selectedMatchInfo);
				resolve(selectedMatchInfo);
			});
		});
	}

	public async getCurrentUser(): Promise<CurrentUser> {
		// console.log('[overwolf-service] retrieving current user');
		return new Promise<CurrentUser>(resolve => {
			overwolf.profile.getCurrentUser(user => {
				// console.log('[overwolf-service] retrieved current user', user);
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
		return new Promise<any>(resolve => {
			overwolf.windows.close(windowId, result => {
				// console.log('[overwolf-service] closed window', windowId);
				resolve(result);
			});
		});
	}

	public async closeWindowFromName(windowName: string) {
		const window = await this.obtainDeclaredWindow(windowName);
		return new Promise<any>(resolve => {
			overwolf.windows.close(window.id, result => {
				// console.log('[overwolf-service] closed window', windowName);
				resolve(result);
			});
		});
	}

	public async restoreWindow(windowId: string) {
		// console.log('[overwolf-service] asked to restore window', windowId, new Error().stack);
		return new Promise<any>(resolve => {
			try {
				overwolf.windows.restore(windowId, async result => {
					// console.log('[overwolf-service] restored window', windowId, new Error().stack);
					resolve(result);
				});
			} catch (e) {
				// This doesn't seem to prevent the window from being restored, so let's ignore it
				console.warn('Exception while restoring window', e);
				resolve(null);
			}
		});
	}

	public async bringToFront(windowId: string) {
		// console.log('[overwolf-service] asked to restore window', windowId, new Error().stack);
		return new Promise<any>(resolve => {
			// https://overwolf.github.io/docs/api/overwolf-windows#setdesktoponlywindowid-shouldbedesktoponly-callback
			try {
				overwolf.windows.bringToFront(windowId, false, result => {
					// console.log('[overwolf-service] restored window', windowId);
					resolve(result);
				});
			} catch (e) {
				console.warn('exception when setting topmost', windowId, e);
				resolve(null);
			}
		});
	}

	public async hideWindow(windowId: string) {
		return new Promise<any>(resolve => {
			try {
				overwolf.windows.hide(windowId, result => {
					// console.log('[overwolf-service] hid window', windowId);
					resolve(result);
				});
			} catch (e) {
				// This doesn't seem to prevent the window from being restored, so let's ignore it
				console.warn('Exception while hiding window', e);
				resolve(null);
			}
		});
	}

	public async hideCollectionWindow(prefs: Preferences) {
		const collectionWindow = await this.getCollectionWindow(prefs);
		const settingsWindow = await this.getSettingsWindow(prefs);
		return new Promise<any>(async resolve => {
			await Promise.all([this.hideWindow(collectionWindow.id), this.hideWindow(settingsWindow.id)]);
			resolve();
		});
	}

	public minimizeWindow(windowId: string) {
		return new Promise<any>(resolve => {
			overwolf.windows.minimize(windowId, result => {
				// console.log('[overwolf-service] minimized window', windowId);
				resolve(result);
			});
		});
	}

	public maximizeWindow(windowId: string) {
		return new Promise<any>(resolve => {
			overwolf.windows.maximize(windowId, result => {
				// console.log('[overwolf-service] maximized window', windowId);
				resolve(result);
			});
		});
	}

	public dragMove(windowId: string, callback?) {
		overwolf.windows.dragMove(windowId, callback);
	}

	public dragResize(windowId: string, edge: string) {
		overwolf.windows.dragResize(windowId, edge);
	}

	public async inGame(): Promise<boolean> {
		return new Promise<boolean>(resolve => {
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
		return new Promise<any>(resolve => {
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
		return new Promise<any>(resolve => {
			overwolf.egs.getSessionInfo((res: any) => {
				resolve(res);
			});
		});
	}

	public async getGameEventsInfo() {
		return new Promise<any>(resolve => {
			overwolf.games.events.getInfo((info: any) => {
				resolve(info);
			});
		});
	}

	public async setGameEventsRequiredFeatures(features) {
		return new Promise<any>(resolve => {
			overwolf.games.events.setRequiredFeatures(features, info => {
				resolve(info);
			});
		});
	}

	public async getHotKey(hotkeyName: string) {
		return new Promise<any>(resolve => {
			overwolf.settings.hotkeys.get((res: any) => {
				const game: any[] = res.games[HEARTHSTONE_GAME_ID];
				const hotkey = game.find((key: any) => key.name === hotkeyName);
				// console.log('found hotkey', hotkey, res, game);
				resolve(hotkey);
			});
		});
	}

	public async setVideoCaptureSettings(resolution: string, fps: number): Promise<any> {
		return new Promise<boolean>(resolve => {
			console.log('[overwolf-service] setting video capture settings', resolution, fps);
			overwolf.settings.setVideoCaptureSettings(resolution, fps, (res: any) => {
				resolve(res);
			});
		});
	}

	public async getVideoCaptureSettings(): Promise<any> {
		return new Promise<boolean>(resolve => {
			overwolf.settings.getVideoCaptureSettings((res: any) => {
				resolve(res);
			});
		});
	}

	public async setAudioCaptureSettings(captureSystemSound: boolean, captureMicrophoneSound: boolean): Promise<any> {
		return new Promise<boolean>(resolve => {
			console.log(
				'[overwolf-service] setting audio capture settings',
				captureSystemSound,
				captureMicrophoneSound,
			);
			overwolf.settings.setAudioCaptureSettings(captureSystemSound, captureMicrophoneSound, (res: any) => {
				resolve(res);
			});
		});
	}

	public async getAudioCaptureSettings(): Promise<any> {
		return new Promise<boolean>(resolve => {
			overwolf.settings.getAudioCaptureSettings((res: any) => {
				resolve(res);
			});
		});
	}

	public async sendMessageWithName(windowName: string, messageType: string, messageBody?: string): Promise<void> {
		const window = await this.obtainDeclaredWindow(windowName);
		return new Promise<void>(resolve => {
			// console.log('[overwolf-service] sending message with name', window.id, messageType);
			overwolf.windows.sendMessage(window.id, messageType, messageBody, () => {
				resolve();
			});
		});
	}

	public async sendMessage(windowId: string, messageType: string, messageBody?: any): Promise<void> {
		return new Promise<void>(resolve => {
			// console.log('[overwolf-service] sending message', windowId, messageType);
			overwolf.windows.sendMessage(windowId, messageType, messageBody, () => {
				resolve();
			});
		});
	}

	public async obtainDeclaredWindow(windowName: string): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			overwolf.windows.obtainDeclaredWindow(windowName, (res: any) => {
				// console.log('[overwolf-service] obtained declared window', windowName, res.window, res);
				if (res.status === 'success') {
					resolve(res.window);
				} else {
					resolve(res);
				}
			});
		});
	}

	public async getCurrentWindow(): Promise<any> {
		return new Promise<any>(resolve => {
			try {
				overwolf.windows.getCurrentWindow((res: any) => {
					// console.log('[overwolf-service] retrieve current window', res);
					resolve(res.window);
				});
			} catch (e) {
				console.warn('Exception while getting current window window');
				resolve(null);
			}
		});
	}

	public async getAppVideoCaptureFolderSize(): Promise<any> {
		return new Promise<boolean>(resolve => {
			overwolf.media.getAppVideoCaptureFolderSize((res: any) => {
				resolve(res);
			});
		});
	}

	public async getOverwolfVideosFolder(): Promise<any> {
		return new Promise<boolean>(resolve => {
			overwolf.settings.getOverwolfVideosFolder((res: any) => {
				resolve(res);
			});
		});
	}

	public async openWindowsExplorer(path: string): Promise<any> {
		return new Promise<boolean>(resolve => {
			console.log('[overwolf-service] opening windows explorer', path);
			overwolf.utils.openWindowsExplorer(path, (res: any) => {
				resolve(res);
			});
		});
	}

	public async changeWindowPosition(windowId: string, newX: number, newY: number): Promise<void> {
		return new Promise<void>(resolve => {
			console.log('[overwolf-service] changing window position', windowId, Math.round(newX), Math.round(newY));
			overwolf.windows.changePosition(windowId, Math.round(newX), Math.round(newY));
			resolve();
		});
	}

	public async changeWindowSize(windowId: string, width: number, height: number): Promise<void> {
		return new Promise<void>(resolve => {
			console.log('[overwolf-service] changing window size', windowId, Math.round(width), Math.round(height));
			overwolf.windows.changeSize(windowId, Math.round(width), Math.round(height));
			resolve();
		});
	}

	public async turnOnReplays(settings): Promise<void> {
		console.log('[overwolf-service] turning on replay capture', settings);
		return new Promise<any>(resolve => {
			overwolf.media.replays.turnOn(settings, result => {
				console.log('[recording] turned on replay capture', result);
				resolve(result);
			});
		});
	}

	public async turnOffReplays(): Promise<void> {
		return new Promise<void>(resolve => {
			overwolf.media.replays.turnOff((res: any) => {
				console.log('[overwolf-service] replays turned off', res);
				resolve();
			});
		});
	}

	public async startReplayCapture(captureDuration: number): Promise<any> {
		console.log('[overwolf-service] starting replay capture', captureDuration);
		return new Promise<any>((resolve, reject) => {
			overwolf.media.replays.startCapture(captureDuration, status => {
				if (status === 'error') {
					console.warn('[overwolf-service] could not start capture', status);
					reject(status);
				} else {
					console.log('[overwolf-service] capture started', status.status);
					resolve(status);
				}
			});
		});
	}

	public async stopReplayCapture(replayId: string): Promise<any> {
		console.log('[overwolf-service] stopping replay capture', replayId);
		return new Promise<any>(resolve => {
			overwolf.media.replays.stopCapture(replayId, result => {
				console.log('[overwolf-service] stopped capture', result.status);
				resolve(result);
			});
		});
	}

	public async getReplayMediaState(): Promise<boolean> {
		return new Promise<boolean>(resolve => {
			overwolf.media.replays.getState((res: any) => {
				resolve(res.isOn);
			});
		});
	}

	public async isGSEnabled(): Promise<any> {
		return new Promise<any>(resolve => {
			overwolf.egs.isEnabled((egsEnabledResult: any) => {
				resolve(egsEnabledResult);
			});
		});
	}

	public async requestGSDisplay(): Promise<any> {
		return new Promise<any>(resolve => {
			overwolf.egs.requestToDisplay((displayRequestResult: any) => {
				resolve(displayRequestResult);
			});
		});
	}

	public async getExtensionInfo(extensionId: string): Promise<any> {
		return new Promise<any>(resolve => {
			overwolf.extensions.getInfo('nafihghfcpikebhfhdhljejkcifgbdahdhngepfb', callbackInfo => {
				console.debug('[overwolf-service] Got extension info', callbackInfo);
				resolve(callbackInfo);
			});
		});
	}

	public async setExtensionInfo(info): Promise<any> {
		return new Promise<any>(resolve => {
			overwolf.extensions.setInfo(info);
			resolve();
		});
	}

	public async registerInfo(id: string, eventsCallback): Promise<any> {
		return new Promise<any>(resolve => {
			overwolf.extensions.registerInfo(id, eventsCallback, () => {
				resolve();
			});
		});
	}

	public async setShelfStatusReady(): Promise<any> {
		return new Promise<any>(resolve => {
			if (!overwolf || !overwolf.egs || !overwolf.egs.setStatus) {
				setTimeout(() => {
					console.log('egs.setStatus not ready yet, waiting');
					this.setShelfStatusReady();
				}, 100);
				return;
			}

			console.log('sending shelf ready message');
			// Start loading the shelf page
			overwolf.egs.setStatus(overwolf.egs.enums.ShelfStatus.Ready, (result: any) => {
				console.log('confirmed ready', result);
				resolve();
			});
		});
	}

	// public async isManastormRunning(): Promise<boolean> {
	// 	return new Promise<boolean>(resolve => {
	// 		overwolf.extensions.getRunningState(OverwolfService.MANASTORM_ID, (res: any) => {
	// 			console.log('[overwolf-service] is Manastorm running?', res);
	// 			resolve(res && res.isRunning);
	// 		});
	// 	});
	// }

	public async getActiveSubscriptionPlans(): Promise<ActiveSubscriptionPlan> {
		return new Promise<ActiveSubscriptionPlan>(resolve => {
			if (!overwolf.profile.subscriptions) {
				resolve({} as ActiveSubscriptionPlan);
				return;
			}
			overwolf.profile.subscriptions.getActivePlans((res: ActiveSubscriptionPlan) => {
				console.log('[overwolf-service] ActiveSubscriptionPlan', res);
				resolve(res);
			});
		});
	}

	public async shouldShowAds(): Promise<boolean> {
		return new Promise<boolean>(resolve => {
			if (!overwolf.profile.subscriptions) {
				resolve(true);
				return;
			}
			overwolf.profile.subscriptions.getActivePlans((activePlans: ActiveSubscriptionPlan) => {
				console.log('[overwolf-service] ActiveSubscriptionPlan', activePlans);
				const hideAds = activePlans && activePlans.plans && activePlans.plans.includes(NO_AD_PLAN);
				resolve(!hideAds);
			});
		});
	}

	private twitterUserInfo: TwitterUserInfo = null;

	public addTwitterLoginStateChangedListener(callback) {
		overwolf.social.twitter.onLoginStateChanged.addListener(async result => {
			callback(result);
			this.twitterUserInfo = await this.getTwitterUserInfo(true);
		});
	}

	public async getTwitterUserInfo(forceRefresh = false): Promise<TwitterUserInfo> {
		if (!forceRefresh && this.twitterUserInfo && this.twitterUserInfo.id) {
			return this.twitterUserInfo;
		}
		return new Promise<TwitterUserInfo>(resolve => {
			overwolf.social.twitter.getUserInfo(res => {
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
		return new Promise<boolean>(resolve => {
			const shareParam = {
				file: filePathOnDisk,
				message: message,
			};
			console.log('[overwolf-service] sharing on Twitter', shareParam);
			overwolf.social.twitter.share(shareParam, (res, error) => {
				console.log('[overwolf-service] uploaded file to twitter', res, error);
				resolve(res);
			});
		});
	}

	public async twitterLogin() {
		overwolf.social.twitter.performUserLogin();
	}

	public async twitterLogout() {
		return new Promise<void>(resolve => {
			overwolf.social.twitter.performLogout(info => {
				this.twitterUserInfo = null;
				resolve(info);
			});
		});
	}

	private redditUserInfo: RedditUserInfo = null;

	public addRedditLoginStateChangedListener(callback) {
		overwolf.social.reddit.onLoginStateChanged.addListener(async result => {
			callback(result);
			this.redditUserInfo = await this.getRedditUserInfo(true);
		});
	}

	public async getRedditUserInfo(forceRefresh = false): Promise<RedditUserInfo> {
		if (!forceRefresh && this.redditUserInfo && this.redditUserInfo.id) {
			return this.redditUserInfo;
		}
		return new Promise<RedditUserInfo>(resolve => {
			overwolf.social.reddit.getUserInfo(res => {
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

	public async redditShare(filePathOnDisk: string, message: string, subreddit: string): Promise<boolean> {
		return new Promise<boolean>(resolve => {
			const shareParam = {
				file: filePathOnDisk,
				title: message,
				subreddit: subreddit,
			};
			console.log('[overwolf-service] sharing on Reddit', shareParam);
			overwolf.social.reddit.share(shareParam, (res, error) => {
				console.log('[overwolf-service] uploaded file to reddit', res, error);
				resolve(res);
			});
		});
	}

	public async redditLogin() {
		overwolf.social.reddit.performUserLogin();
	}

	public async redditLogout() {
		return new Promise<void>(resolve => {
			overwolf.social.reddit.performLogout(info => {
				this.redditUserInfo = null;
				resolve(info);
			});
		});
	}

	public async listFilesInAppDirectory(appName: string): Promise<any> {
		return new Promise<any>(resolve => {
			overwolf.io.dir(`${overwolf.io.paths.localAppData}/overwolf/Log/Apps/${appName}`, res => {
				resolve(res);
			});
		});
	}

	public async fileExists(filePathOnDisk: string): Promise<boolean> {
		return new Promise<boolean>(resolve => {
			overwolf.io.fileExists(filePathOnDisk, (res, error) => {
				console.log('[overwolf-service] fileExists?', filePathOnDisk, res);
				resolve(res.found);
			});
		});
	}

	public async writeFileContents(filePathOnDisk: string, content: string): Promise<string> {
		return new Promise<string>(resolve => {
			overwolf.io.writeFileContents(filePathOnDisk, content, 'UTF8', false, (res, error) => {
				console.log('[overwolf-service] written file', res, error);
				resolve(res.success ? res.content : null);
			});
		});
	}

	public async getFileContents(filePathOnDisk: string): Promise<string> {
		return new Promise<string>(resolve => {
			overwolf.io.readTextFile(filePathOnDisk, { encoding: 'UTF8' }, (res, error) => {
				// console.log('[overwolf-service] file contents', res, error);
				resolve(res.success ? res.content : null);
			});
		});
	}

	public async deleteFile(filePathOnDisk: string): Promise<boolean> {
		return new Promise<boolean>(resolve => {
			overwolf.io.writeFileContents(filePathOnDisk, '', 'UTF8', false, (res, error) => {
				console.log('[overwolf-service] file overwritten?', res);
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
		return new Promise<string>(resolve => {
			overwolf.utils.getFromClipboard((res, error) => {
				resolve(res);
			});
		});
	}

	public async placeOnClipboard(value: string): Promise<void> {
		return new Promise<void>(resolve => {
			overwolf.utils.placeOnClipboard(value);
			resolve();
		});
	}

	public async getMonitorsList(): Promise<any> {
		return new Promise<any>(resolve => {
			overwolf.utils.getMonitorsList(res => {
				resolve(res);
			});
		});
	}

	public listenOnFile(id: string, path: string, options: any, callback: (lineInfo: ListenObject) => any) {
		overwolf.io.listenOnFile(id, path, options, callback);
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
