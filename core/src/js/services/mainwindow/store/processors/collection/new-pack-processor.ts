import { AllCardsService } from '@firestone-hs/replay-parser';
import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PackHistory } from '../../../../../models/pack-history';
import { PityTimer } from '../../../../../models/pity-timer';
import { Set } from '../../../../../models/set';
import { IndexedDbService } from '../../../../collection/indexed-db.service';
import { PackHistoryService } from '../../../../collection/pack-history.service';
import { NewPackEvent } from '../../events/collection/new-pack-event';
import { Processor } from '../processor';

export class NewPackProcessor implements Processor {
	constructor(private indexedDb: IndexedDbService, private allCards: AllCardsService) {}

	public async process(
		event: NewPackEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		// Save the new pack info
		const newPack: PackHistory = new PackHistory(event.setId, event.packCards);
		await this.indexedDb.saveNewPack(newPack);

		// Update the pity timers
		const setToUpdate = currentState.binder.allSets.find(set => set.id === event.setId);
		const updatedSet: Set = await this.updatePityTimer(setToUpdate, event.packCards);
		const newSets = [];
		for (const set of currentState.binder.allSets) {
			if (set.id === updatedSet.id) {
				newSets.push(updatedSet);
			} else {
				newSets.push(set);
			}
		}
		// console.error('TODO: change this logic to only store the ID in the navigation, like we do for achievements');
		// const newSelectedSet =
		// 	navigationState.navigationCollection.selectedSetId === updatedSet.id
		// 		? updatedSet
		// 		: navigationState.navigationCollection.selectedSet;
		const newBinder = Object.assign(new BinderState(), currentState.binder, {
			allSets: newSets as readonly Set[],
		} as BinderState);
		const newCollection = navigationState.navigationCollection.update({
			selectedSetId: updatedSet.id,
		} as NavigationCollection);
		return [
			Object.assign(new MainWindowState(), currentState, {
				binder: newBinder,
			} as MainWindowState),
			navigationState.update({
				navigationCollection: newCollection,
			} as NavigationState),
		];
	}

	private async updatePityTimer(setToUpdate: Set, packCards: readonly any[]) {
		let pityTimer = await this.indexedDb.getPityTimer(setToUpdate.id);
		if (!pityTimer) {
			pityTimer = new PityTimer(
				setToUpdate.id,
				PackHistoryService.DEFAULT_EPIC_PITY_TIMER,
				PackHistoryService.DEFAULT_LEGENDARY_PITY_TIMER,
			);
		}
		const newPityTimer = this.buildNewPityTimer(pityTimer, packCards);
		const result = await this.indexedDb.savePityTimer(newPityTimer);
		return Object.assign(new Set(setToUpdate?.id, setToUpdate?.name, setToUpdate?.launchDate), setToUpdate, {
			pityTimer: result,
		} as Set);
	}

	private buildNewPityTimer(pityTimer: PityTimer, cards: readonly any[]): any {
		let pityTimerEpics = pityTimer.packsUntilGuaranteedEpic;
		if (this.hasCardWithRarity(cards, 'Epic')) {
			pityTimerEpics = PackHistoryService.DEFAULT_EPIC_PITY_TIMER;
		} else {
			pityTimerEpics = pityTimerEpics - 1;
		}
		let pityTimerLegendaries = pityTimer.packsUntilGuaranteedLegendary;
		if (this.hasCardWithRarity(cards, 'Legendary')) {
			pityTimerLegendaries = PackHistoryService.DEFAULT_LEGENDARY_PITY_TIMER;
		} else {
			pityTimerLegendaries = pityTimerLegendaries - 1;
		}
		return new PityTimer(pityTimer.setId, pityTimerEpics, pityTimerLegendaries);
	}

	private hasCardWithRarity(cards: readonly any[], rarity: string): any {
		const rarityCards = cards
			.map(card => this.allCards.getCard(card.cardId))
			.map(card => card.rarity)
			.filter(cardRarity => cardRarity === rarity);
		return rarityCards.length !== 0;
	}
}
