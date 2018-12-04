import { Injectable } from '@angular/core';

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
