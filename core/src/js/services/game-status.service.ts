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

	private async init() {
		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (this.ow.exitGame(res)) {
				console.debug('leaving game');
				this.listeners.forEach((cb) => cb());
			}
		});
	}
}
