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
