import { Injectable } from '@angular/core';

import { IndexedDbService } from './indexed-db.service';
import { PityTimer } from '../../models/pity-timer';
import { AllCardsService } from '../all-cards.service';

@Injectable()
export class PackHistoryService {
	public static readonly DEFAULT_EPIC_PITY_TIMER: number = 10;
	public static readonly DEFAULT_LEGENDARY_PITY_TIMER: number = 40;

	constructor(private indexedDb: IndexedDbService, private allCards: AllCardsService) {}

	public getPityTimers(): Promise<PityTimer[]> {
		return new Promise<PityTimer[]>(resolve => {
			this.indexedDb.getAllPityTimers().then((pityTimers: PityTimer[]) => {
				// console.log('retrieved all pity timers', pityTimers);
				const setIds: string[] = this.allCards.getSetIds();
				// console.log('allSetIds', setIds);
				const allPityTimers: PityTimer[] = setIds.map(setId => this.findPityTimerOrDefault(setId, pityTimers));
				// console.log('built all pity timers', allPityTimers);
				resolve(allPityTimers);
			});
		});
	}

	public getPityTimer(setId: string): Promise<PityTimer> {
		return new Promise<PityTimer>(resolve => {
			this.indexedDb.getPityTimer(setId).then((pityTimer: PityTimer) => {
				console.log('retrieved pity timer for', setId, pityTimer);
				resolve(pityTimer);
			});
		});
	}

	private findPityTimerOrDefault(setId: string, pityTimers: PityTimer[]): PityTimer {
		for (const pityTimer of pityTimers) {
			if (pityTimer.setId === setId) {
				return pityTimer;
			}
		}
		return new PityTimer(setId, PackHistoryService.DEFAULT_EPIC_PITY_TIMER, PackHistoryService.DEFAULT_LEGENDARY_PITY_TIMER);
	}
}
