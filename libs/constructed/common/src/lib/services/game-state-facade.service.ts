import { Injectable } from '@angular/core';
import { GameState } from '@firestone/game-state';
import { sleep } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class GameStateFacadeService {
	public gameState$$: BehaviorSubject<GameState | null>;

	constructor(private readonly ow: OverwolfService) {
		this.init();
	}

	public async isReady() {
		while (!this.gameState$$) {
			await sleep(50);
		}
	}

	private async init() {
		while (!this.ow.getMainWindow().deckEventBus) {
			await sleep(50);
		}

		this.gameState$$ = new BehaviorSubject<GameState | null>(null);
		this.ow.getMainWindow().deckEventBus.subscribe(async (event) => {
			this.gameState$$.next(event?.state);
		});
	}
}
