import { CardsFacadeService } from '@services/cards-facade.service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Set } from '../../../../../models/set';
import { ShowCardDetailsEvent } from '../../events/collection/show-card-details-event';
import { Processor } from '../processor';

export class ShowCardDetailsProcessor implements Processor {
	constructor(private cards: CardsFacadeService) {}

	public async process(
		event: ShowCardDetailsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const selectedSet: Set = this.pickSet(currentState.binder.allSets, event.cardId);
		const referenceCard = this.cards.getCard(event.cardId);
		const newCollection = navigationState.navigationCollection.update({
			currentView: 'card-details',
			menuDisplayType: 'breadcrumbs',
			selectedSetId: selectedSet?.id,
			selectedCardId: event.cardId,
			selectedCardBackId: undefined,
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
