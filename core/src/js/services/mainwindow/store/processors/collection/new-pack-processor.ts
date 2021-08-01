import { CardPackResult, PackResult } from '@firestone-hs/retrieve-pack-stats';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { PityTimer } from '../../../../../models/pity-timer';
import { Set } from '../../../../../models/set';
import { CollectionManager } from '../../../../collection/collection-manager.service';
import { NewPackEvent } from '../../events/collection/new-pack-event';
import { Processor } from '../processor';

export class NewPackProcessor implements Processor {
	constructor(private collectionManager: CollectionManager, private allCards: CardsFacadeService) {}

	public async process(
		event: NewPackEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newPack: PackResult = {
			id: 0,
			creationDate: Date.now(),
			boosterId: event.boosterId,
			setId: event.setId,
			cards: event.packCards.map(
				(card) =>
					({
						cardId: card.cardId,
						cardType: card.cardType,
						cardRarity: this.allCards.getCard(card.cardId)?.rarity?.toLowerCase(),
					} as CardPackResult),
			),
		};
		console.log('[pack-history] handling new pack', newPack);
		// Save the new pack info
		const newPackStats: readonly PackResult[] = [newPack, ...currentState.binder.packStats];

		const setToUpdate = currentState.binder.allSets.find((set) => set.id === event.setId);
		const pityTimer: PityTimer = this.collectionManager
			.buildPityTimers(newPackStats.filter((stat) => stat.setId === event.setId))
			.find((pityTimer) => pityTimer.setId === event.setId);
		const updatedSet: Set = setToUpdate.update({
			pityTimer: pityTimer,
		} as Set);
		const newSets: readonly Set[] = currentState.binder.allSets.map((set) =>
			set.id === updatedSet.id ? updatedSet : set,
		);
		const newBinder = Object.assign(new BinderState(), currentState.binder, {
			allSets: newSets,
			packStats: newPackStats,
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
}
