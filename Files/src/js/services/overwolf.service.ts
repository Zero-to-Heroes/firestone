import { Injectable } from '@angular/core';
import { TwitterUserInfo } from '../models/mainwindow/twitter-user-info';

declare var overwolf: any;

const HEARTHSTONE_GAME_ID = 9898;

@Injectable()
export class OverwolfService {

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

	public async sendMessage(windowName: string, messageType: string, messageBody?: string): Promise<void> {
		const window = await this.obtainDeclaredWindow(windowName);
		return new Promise<void>((resolve) => {
			overwolf.windows.sendMessage(window.id,messageType, messageBody, (result) => {
				resolve();
			});
        });

	}

	public async obtainDeclaredWindow(windowName: string): Promise<any> {
		return new Promise<any>((resolve, reject) => {
            overwolf.windows.obtainDeclaredWindow(windowName, (res: any) => {
				if (res.status === 'success') {
					resolve(res.window);
				}
				else {
					reject(res);
				}
            });
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

    public async turnOffReplays(): Promise<void> {
		return new Promise<void>((resolve) => {
            overwolf.media.replays.turnOff((res: any) => {
				console.log('[recording] replays turned off', res);
                resolve();
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
	
    public async getTwitterUserInfo(): Promise<TwitterUserInfo> {
		return new Promise<TwitterUserInfo>((resolve) => {
            overwolf.social.twitter.getUserInfo((res) => {
				if (res.status !== 'success' || !res.userInfo)  {
					resolve({
						avatarUrl: undefined,
						id: undefined,
						name: undefined,
						screenName: undefined,
					} as TwitterUserInfo);
					return;
				}
                resolve({
					avatarUrl: res.userInfo.avatar,
					id: res.userInfo.id,
					name: res.userInfo.name,
					screenName: res.userInfo.screenName,
				} as TwitterUserInfo);
            });
        });
	}
	
    public async twitterShare(filePathOnDisk: string, message: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
            overwolf.social.twitter.share({
				file: filePathOnDisk,
				message: message,
			}, 
			(res, error) => {
				console.log('uploaded file to twitter', res, error);
                resolve(res);
            });
        });
	}

	private gameRunning(gameInfo: any): boolean {
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
}
