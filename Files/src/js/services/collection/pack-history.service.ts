import { Injectable } from '@angular/core';

import { Events } from '../events.service';
import { IndexedDbService } from './indexed-db.service';
import { PackHistory } from '../../models/pack-history';
import { PityTimer } from '../../models/pity-timer';
import { AllCardsService } from '../all-cards.service';


@Injectable()
export class PackHistoryService {
    
    private readonly DEFAULT_EPIC_PITY_TIMER: number = 10;
    private readonly DEFAULT_LEGENDARY_PITY_TIMER: number = 40;

	constructor(private events: Events, private indexedDb: IndexedDbService, private allCards: AllCardsService) {
        this.events.on(Events.NEW_PACK).subscribe(event => this.addPackHistory(event));
        this.events.on(Events.NEW_PACK).subscribe(event => this.updatePityTimer(event));
    }

    public getPityTimers(): Promise<PityTimer[]> {
        return new Promise<PityTimer[]>((resolve) => {
            this.indexedDb.getAllPityTimers().then((pityTimers: PityTimer[]) => {
                console.log('retrieved all pity timers', pityTimers);
                const setIds: string[] = this.allCards.getSetIds();
                console.log('allSetIds', setIds);
                const allPityTimers: PityTimer[] = setIds.map((setId) => this.findPityTimerOrDefault(setId, pityTimers));
                console.log('built all pity timers', allPityTimers);
                resolve(allPityTimers);
            });
        })
    }

    public getPityTimer(setId: string): Promise<PityTimer> {
        return new Promise<PityTimer>((resolve) => {
            this.indexedDb.getPityTimer(setId).then((pityTimer: PityTimer) => {
                console.log('retrieved pity timer for', setId, pityTimer);
                resolve(pityTimer);
            });
        })
    }

    private findPityTimerOrDefault(setId: string, pityTimers: PityTimer[]): PityTimer {
        for (const pityTimer of pityTimers) {
            if (pityTimer.setId == setId) {
                return pityTimer;
            }
        }
        return new PityTimer(setId, this.DEFAULT_EPIC_PITY_TIMER, this.DEFAULT_LEGENDARY_PITY_TIMER);
    }
    
    private addPackHistory(event: any): any {
        const newPack: PackHistory = new PackHistory(event.data[0], event.data[1]);
        console.log('adding pack history', newPack);
        this.indexedDb.saveNewPack(newPack, (result) => {
			console.log('new pack history saved', result);
		})
    }
    
    private updatePityTimer(event: any): any {
        console.log('updatePityTimer', event);
        const setId = event.data[0];
        this.indexedDb.getPityTimer(setId).then((pityTimer) => {
            console.log('retrieved pity timer', setId, pityTimer);
            if (!pityTimer) {
                pityTimer = new PityTimer(setId, this.DEFAULT_EPIC_PITY_TIMER, this.DEFAULT_LEGENDARY_PITY_TIMER);
            }
            const newPityTimer = this.buildNewPityTimer(pityTimer, event.data[1]);
            console.log('built new pity timer to save', newPityTimer);
            this.indexedDb.savePityTimer(newPityTimer, (result) => {
                console.log('Updated pity timer', result);
            });
        });
    }

    private buildNewPityTimer(pityTimer: PityTimer, cards: any[]): any {
        let pityTimerEpics = pityTimer.packsUntilGuaranteedEpic;
        if (this.hasCardWithRarity(cards, 'Epic')) {
            console.log('got epic card', cards);
            pityTimerEpics = this.DEFAULT_EPIC_PITY_TIMER;
        }
        else {
            pityTimerEpics = pityTimerEpics - 1;
        }
        let pityTimerLegendaries = pityTimer.packsUntilGuaranteedLegendary;
        if (this.hasCardWithRarity(cards, 'Legendary')) {
            console.log('got legendary card', cards);
            pityTimerLegendaries = this.DEFAULT_LEGENDARY_PITY_TIMER;
        }
        else {
            pityTimerLegendaries = pityTimerLegendaries - 1;
        }
        return new PityTimer(pityTimer.setId, pityTimerEpics, pityTimerLegendaries);
    }

    private hasCardWithRarity(cards: any[], rarity: string): any {
        const rarityCards = cards.map(card => this.allCards.getCard(card.cardId))
                .map(card => card.rarity)
                .filter(cardRarity => cardRarity === rarity);
        console.log('rarityCards', rarityCards);
        return rarityCards.length !== 0;
    }
}
