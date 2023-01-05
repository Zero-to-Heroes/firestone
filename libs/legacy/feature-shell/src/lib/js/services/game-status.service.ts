import { Injectable } from '@angular/core';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class GameStatusService {
	private startListeners = [];
	private exitListeners = [];

	constructor(private readonly ow: OverwolfService) {
		this.init();
	}

	public onGameStart(callback) {
		this.startListeners.push(callback);
	}

	public onGameExit(callback) {
		this.exitListeners.push(callback);
	}

	public async inGame(): Promise<boolean> {
		return this.ow.inGame();
	}

	private async init() {
		this.ow.addGameInfoUpdatedListener(async (res) => {
			if (this.ow.exitGame(res)) {
				this.exitListeners.forEach((cb) => cb());
			} else if ((await this.ow.inGame()) && res.gameChanged) {
				console.debug('[game-status] game launched');
				this.startListeners.forEach((cb) => cb());
			}
		});
	}
}
