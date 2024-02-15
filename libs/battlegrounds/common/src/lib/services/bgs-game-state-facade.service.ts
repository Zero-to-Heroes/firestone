import { Injectable } from '@angular/core';
import { sleep } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { BattlegroundsState } from '../model/battlegrounds-state';

@Injectable()
export class BgsGameStateFacadeService {
	public gameState$$: BehaviorSubject<BattlegroundsState | null>;

	constructor(private readonly ow: OverwolfService) {
		this.init();
	}

	public async isReady() {
		while (!this.gameState$$) {
			await sleep(50);
		}
	}

	private async init() {
		while (!this.ow.getMainWindow().battlegroundsStore) {
			await sleep(50);
		}

		this.gameState$$ = new BehaviorSubject<BattlegroundsState | null>(null);
		this.ow.getMainWindow().battlegroundsStore.subscribe(async (state) => {
			this.gameState$$.next(state);
		});
	}
}
