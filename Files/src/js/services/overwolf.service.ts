import { Injectable } from '@angular/core';
import { TwitterUserInfo } from '../models/mainwindow/twitter-user-info';

declare var overwolf: any;

const HEARTHSTONE_GAME_ID = 9898;

@Injectable()
export class OverwolfService {
	public static COLLECTION_WINDOW = 'CollectionWindow';
	public static SETTINGS_WINDOW = 'SettingsWindow';
	public static LOADING_WINDOW = 'LoadingWindow';
	public static WELCOME_WINDOW = 'WelcomeWindow';
	public static DECKTRACKER_WINDOW = 'DeckTrackerWindow';
	public static NOTIFICATIONS_WINDOW = 'NotificationsWindow';

	public getMainWindow(): any {
		return overwolf.windows.getMainWindow();
	}

	public addStateChangedListener(targetWindowName: string, callback) {
		overwolf.windows.onStateChanged.addListener(message => {
			if (message.window_name !== targetWindowName) {
				return;
			}
			callback(message);
		});
	}

	public addAppLaunchTriggeredListener(callback) {
		overwolf.extensions.onAppLaunchTriggered.addListener(callback);
	}

	public addGameInfoUpdatedListener(callback) {
		overwolf.games.onGameInfoUpdated.addListener(callback);
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

	public addMessageReceivedListener(callback) {
		overwolf.windows.onMessageReceived.addListener(callback);
	}

	public addVideoCaptureSettingsChangedListener(callback) {
		overwolf.settings.OnVideoCaptureSettingsChanged.addListener(callback);
	}

	public addTwitterLoginStateChangedListener(callback) {
		overwolf.social.twitter.onLoginStateChanged.addListener(callback);
	}

	public addHotKeyPressedListener(hotkey: string, callback) {
		overwolf.settings.registerHotKey(hotkey, callback);
	}

	public addMouseUpListener(callback) {
		overwolf.games.inputTracking.onMouseUp.addListener(callback);
	}

	public addKeyUpListener(callback) {
		overwolf.games.inputTracking.onKeyUp.addListener(callback);
	}

	public openUrlInOverwolfBrowser(url) {
		overwolf.utils.openUrlInOverwolfBrowser(url);
	}

	public async getOpenWindows() {
		return new Promise<any>(resolve => {
			overwolf.windows.getOpenWindows((res: any) => {
				console.log('[overwolf-service] retrieve all open windows', res);
				resolve(res);
			});
		});
	}

	public async getWindowsStates() {
		return new Promise<any>(resolve => {
			overwolf.windows.getWindowsStates((res: any) => {
				console.log('[overwolf-service] retrieve all windows states', res);
				resolve(res);
			});
		});
	}

	public async getManifest(extensionId: string) {
		return new Promise<string>(resolve => {
			overwolf.extensions.getManifest(extensionId, result => {
				resolve(result.meta.version);
			});
		});
	}

	public async getCurrentUser() {
		return new Promise<any>(resolve => {
			overwolf.profile.getCurrentUser(user => {
				resolve(user);
			});
		});
	}

	public async closeWindow(windowId: string) {
		return new Promise<any>(resolve => {
			overwolf.windows.close(windowId, result => {
				resolve(result);
			});
		});
	}

	public async closeWindowFromName(windowName: string) {
		const window = await this.obtainDeclaredWindow(windowName);
		return new Promise<any>(resolve => {
			overwolf.windows.close(window.id, result => {
				console.log('[overwolf-service] closed window', windowName, result);
				resolve(result);
			});
		});
	}

	public async restoreWindow(windowId: string) {
		return new Promise<any>(resolve => {
			overwolf.windows.restore(windowId, result => {
				console.log('[overwolf-service] restored window', windowId, result);
				resolve(result);
			});
		});
	}

	public hideWindow(windowId: string) {
		return new Promise<any>(resolve => {
			overwolf.windows.hide(windowId, result => {
				console.log('[overwolf-service] hid window', windowId, result);
				resolve(result);
			});
		});
	}

	public minimizeWindow(windowId: string) {
		return new Promise<any>(resolve => {
			overwolf.windows.minimize(windowId, result => {
				console.log('[overwolf-service] minimized window', windowId, result);
				resolve(result);
			});
		});
	}

	public maximizeWindow(windowId: string) {
		return new Promise<any>(resolve => {
			overwolf.windows.maximize(windowId, result => {
				console.log('[overwolf-service] maximized window', windowId, result);
				resolve(result);
			});
		});
	}

	public dragMove(windowId: string) {
		overwolf.windows.dragMove(windowId);
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

	public async getRunningGameInfo() {
		return new Promise<any>(resolve => {
			overwolf.games.getRunningGameInfo((res: any) => {
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
			overwolf.settings.getHotKey(hotkeyName, (res: any) => {
				if (res.status === 'success') {
					resolve(res.hotkey);
				}
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
			console.log('[overwolf-service] setting audio capture settings', captureSystemSound, captureMicrophoneSound);
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
			console.log('[overwolf-service] sending message with name', window.id, messageType, messageBody);
			overwolf.windows.sendMessage(window.id, messageType, messageBody, () => {
				resolve();
			});
		});
	}

	public async sendMessage(windowId: string, messageType: string, messageBody?: any): Promise<void> {
		return new Promise<void>(resolve => {
			console.log('[overwolf-service] sending message', windowId, messageType, messageBody);
			overwolf.windows.sendMessage(windowId, messageType, messageBody, () => {
				resolve();
			});
		});
	}

	public async obtainDeclaredWindow(windowName: string): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			overwolf.windows.obtainDeclaredWindow(windowName, (res: any) => {
				if (res.status === 'success') {
					console.log('[overwolf-service] obtained declared window', windowName, res.window);
					resolve(res.window);
				} else {
					reject(res);
				}
			});
		});
	}

	public async getCurrentWindow(): Promise<any> {
		return new Promise<any>(resolve => {
			overwolf.windows.getCurrentWindow((res: any) => {
				resolve(res.window);
			});
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
			console.log('[overwolf-service] changing window position', windowId, newX, newY, Math.round(newX), Math.round(newY));
			overwolf.windows.changePosition(windowId, Math.round(newX), Math.round(newY));
			resolve();
		});
	}

	public async changeWindowSize(windowId: string, width: number, height: number): Promise<void> {
		return new Promise<void>(resolve => {
			console.log('[overwolf-service] changing window size', windowId, width, height, Math.round(width), Math.round(height));
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
					console.log('[overwolf-service] capture started', status);
					resolve(status);
				}
			});
		});
	}

	public async stopReplayCapture(replayId: string): Promise<any> {
		console.log('[overwolf-service] stopping replay capture', replayId);
		return new Promise<any>(resolve => {
			overwolf.media.replays.stopCapture(replayId, result => {
				console.log('[overwolf-service] stopped capture', result);
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

	public async getTwitterUserInfo(): Promise<TwitterUserInfo> {
		return new Promise<TwitterUserInfo>(resolve => {
			overwolf.social.twitter.getUserInfo(res => {
				if (res.status !== 'success' || !res.userInfo) {
					const result: TwitterUserInfo = {
						avatarUrl: undefined,
						id: undefined,
						name: undefined,
						screenName: undefined,
					};
					resolve(result);
					return;
				}
				const result: TwitterUserInfo = {
					avatarUrl: res.userInfo.avatar,
					id: res.userInfo.id,
					name: res.userInfo.name,
					screenName: res.userInfo.screenName,
				};
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
			console.log('[overwolf-service] sharing on Twitter', shareParam),
				overwolf.social.twitter.share(shareParam, (res, error) => {
					console.log('uploaded file to twitter', res, error);
					resolve(res);
				});
		});
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
}
