import { Injectable } from '@angular/core';

import { OverwolfService } from '../overwolf.service';

const HEARTHSTONE_GAME_ID = 9898;

declare var overwolf;

@Injectable()
export class TemporaryResolutionOverrideService {

	private readonly RESOLUTION_ENUM = {
		0: overwolf.settings.enums.ResolutionSettings.Original,
		1: overwolf.settings.enums.ResolutionSettings.R1080p,
		2: overwolf.settings.enums.ResolutionSettings.R720p,
		3: overwolf.settings.enums.ResolutionSettings.R480p
	};

    private listenerRegistered: boolean = false;
    private restoring: boolean = false;
    private oldSettings;

	constructor(private owService: OverwolfService) {
        // this.overrideVideoSettings();
        overwolf.games.onGameInfoUpdated.addListener((res: any) => {
			if (this.exitGame(res)) {
				this.restoreSettings();
            }
            else if (this.gameLaunched(res)) {
                this.overrideVideoSettings();
            }
		});
		overwolf.games.getRunningGameInfo((res: any) => {
			if (res && res.isRunning && res.id && Math.floor(res.id / 10) === HEARTHSTONE_GAME_ID) {
				this.overrideVideoSettings();
			}
		});
    }

    private async overrideVideoSettings() {
        // Register this only when the game is launched
        if (!this.listenerRegistered && !this.restoring) {
            overwolf.settings.OnVideoCaptureSettingsChanged.addListener((data) => this.overrideVideoSettings());
            this.listenerRegistered = true;
        }
        const settings = await this.owService.getVideoCaptureSettings();
        console.log('[temp-override] Retrieved old settings', settings);
        if (!this.oldSettings) {
            this.oldSettings = settings;
        }
        // If the video resolution is 1080p or higher, override to a 720p preset settings
        if (settings.resolution <= 1) {
            console.log('[temp-override] Overriding settings');
            this.owService.setVideoCaptureSettings(this.RESOLUTION_ENUM[2], 60); 
        }
    }
    
    private restoreSettings() {
        // Prevent the default override mechanism when restoring the settings
        this.restoring = true;
        this.owService.setVideoCaptureSettings(this.RESOLUTION_ENUM[this.oldSettings.resolution], this.oldSettings.fps); 
        console.log('[temp-override] restoring previous settings', this.oldSettings);
    }

	private exitGame(gameInfoResult: any): boolean {
		return (!gameInfoResult || !gameInfoResult.gameInfo || !gameInfoResult.gameInfo.isRunning);
    }

    private gameLaunched(gameInfoResult: any): boolean {
		if (!gameInfoResult || !gameInfoResult.gameInfo || !gameInfoResult.gameInfo.isRunning) {
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
