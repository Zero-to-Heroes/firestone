import { Processor } from "../processor";
import { MainWindowState } from "../../../../../models/mainwindow/main-window-state";
import { BinderState } from "../../../../../models/mainwindow/binder-state";
import { NewPackEvent } from "../../events/collection/new-pack-event";
import { PackHistory } from "../../../../../models/pack-history";
import { PackHistoryService } from "../../../../collection/pack-history.service";
import { IndexedDbService } from "../../../../collection/indexed-db.service";
import { PityTimer } from "../../../../../models/pity-timer";
import { Set } from "../../../../../models/set";
import { AllCardsService } from "../../../../all-cards.service";

export class NewPackProcessor implements Processor {

    constructor(private indexedDb: IndexedDbService, private allCards: AllCardsService) { }

    public async process(event: NewPackEvent, currentState: MainWindowState): Promise<MainWindowState> {
        // Save the new pack info
        const newPack: PackHistory = new PackHistory(event.setId, event.packCards);
        await this.indexedDb.saveNewPack(newPack);

        // Update the pity timers
        const setToUpdate = currentState.binder.allSets.find((set) => set.id === event.setId);
        const updatedSet: Set = await this.updatePityTimer(setToUpdate, event.packCards);
        const newSets = [];
        for (let set of currentState.binder.allSets) {
            if (set.id === updatedSet.id) {
                newSets.push(updatedSet);
            }
            else {
                newSets.push(set);
            }
        }
        const newSelectedSet = currentState.binder.selectedSet && currentState.binder.selectedSet.id === updatedSet.id
                ? updatedSet
                : currentState.binder.selectedSet;
        const newBinder = Object.assign(new BinderState(), currentState.binder, {
            allSets: newSets as ReadonlyArray<Set>,
            selectedSet: newSelectedSet,
        } as BinderState)
        return Object.assign(new MainWindowState(), currentState, {
            binder: newBinder,
        } as MainWindowState)
    }
    
    private async updatePityTimer(setToUpdate: Set, packCards: ReadonlyArray<any>) {
        let pityTimer = await this.indexedDb.getPityTimer(setToUpdate.id);
        if (!pityTimer) {
            pityTimer = new PityTimer(setToUpdate.id, PackHistoryService.DEFAULT_EPIC_PITY_TIMER, PackHistoryService.DEFAULT_LEGENDARY_PITY_TIMER);
        }
        const newPityTimer = this.buildNewPityTimer(pityTimer, packCards);
        const result = await this.indexedDb.savePityTimer(newPityTimer);
        return Object.assign(new Set(), setToUpdate, {
            pityTimer: result,
        } as Set);
    }

    private buildNewPityTimer(pityTimer: PityTimer, cards: ReadonlyArray<any>): any {
        let pityTimerEpics = pityTimer.packsUntilGuaranteedEpic;
        if (this.hasCardWithRarity(cards, 'Epic')) {
            pityTimerEpics = PackHistoryService.DEFAULT_EPIC_PITY_TIMER;
        }
        else {
            pityTimerEpics = pityTimerEpics - 1;
        }
        let pityTimerLegendaries = pityTimer.packsUntilGuaranteedLegendary;
        if (this.hasCardWithRarity(cards, 'Legendary')) {
            pityTimerLegendaries = PackHistoryService.DEFAULT_LEGENDARY_PITY_TIMER;
        }
        else {
            pityTimerLegendaries = pityTimerLegendaries - 1;
        }
        return new PityTimer(pityTimer.setId, pityTimerEpics, pityTimerLegendaries);
    }

    private hasCardWithRarity(cards: ReadonlyArray<any>, rarity: string): any {
        const rarityCards = cards.map(card => this.allCards.getCard(card.cardId))
                .map(card => card.rarity)
                .filter(cardRarity => cardRarity === rarity);
        return rarityCards.length !== 0;
    }
}