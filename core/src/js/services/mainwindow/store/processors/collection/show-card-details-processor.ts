import { AllCardsService } from '@firestone-hs/replay-parser';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Set, SetCard } from '../../../../../models/set';
import { ShowCardDetailsEvent } from '../../events/collection/show-card-details-event';
import { Processor } from '../processor';

export class ShowCardDetailsProcessor implements Processor {
	constructor(private cards: AllCardsService) {}

	public async process(
		event: ShowCardDetailsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const selectedSet: Set = this.pickSet(currentState.binder.allSets, event.cardId);
		const selectedCard: SetCard = selectedSet ? this.pickCard(selectedSet, event.cardId) : null;
		const referenceCard = this.cards.getCard(event.cardId);
		const newCollection = navigationState.navigationCollection.update({
			currentView: 'card-details',
			menuDisplayType: 'breadcrumbs',
			selectedSetId: selectedSet?.id,
			selectedCardId: event.cardId,
			selectedCardBackId: undefined,
			selectedFormat: selectedSet
				? selectedSet.standard
					? 'standard'
					: 'wild'
				: navigationState.navigationCollection.selectedFormat,
			searchString: undefined,
			searchResults: [] as readonly string[],
		} as NavigationCollection);
		return [
			null,
			navigationState.update({
				isVisible: true,
				currentApp: 'collection',
				navigationCollection: newCollection,
				text: referenceCard.name,
				image: null,
			} as NavigationState),
		];
	}

	private pickCard(selectedSet: Set, cardId: string): SetCard {
		let card = selectedSet.allCards.find((card) => card.id === cardId);
		if (!card) {
			const rawCard = this.cards.getCard(cardId);
			card = new SetCard(cardId, rawCard.name, rawCard.playerClass, rawCard.rarity, rawCard.cost, 0, 0);
		}
		return card;
	}

	private pickSet(allSets: readonly Set[], cardId: string): Set {
		let set = allSets.find((set) => set.allCards.some((card) => card.id === cardId));
		// Happens when cardId is not collectible
		if (!set) {
			const card = this.cards.getCard(cardId);
			const setId = card.set.toLowerCase();
			set = allSets.find((set) => set.id === setId);
		}
		return set;
	}
}
