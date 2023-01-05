import { Injectable } from '@angular/core';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class GameStatusService {
	private listeners = [];

	constructor(private readonly ow: OverwolfService) {
		this.init();
	}

	public onGameExit(callback) {
		this.listeners.push(callback);
	}

	public async inGame(): Promise<boolean> {
		return this.ow.inGame();
	}

	private async init() {
		this.ow.addGameInfoUpdatedListener(async (res) => {
			if (this.ow.exitGame(res)) {
				this.listeners.forEach((cb) => cb());
			}
		});
	}
}
