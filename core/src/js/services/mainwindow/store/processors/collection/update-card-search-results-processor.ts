import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CollectionManager } from '../../../../collection/collection-manager.service';
import { SetsService } from '../../../../sets-service.service';
import { UpdateCardSearchResultsEvent } from '../../events/collection/update-card-search-results-event';
import { Processor } from '../processor';

export class UpdateCardSearchResultsProcessor implements Processor {
	constructor(private collectionManager: CollectionManager, private cards: SetsService) {}

	public async process(
		event: UpdateCardSearchResultsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		// const collection = await this.collectionManager.getCollection();
		// const searchResults: readonly SetCard[] = this.cards.searchCards(event.searchString).map(card => {
		// 	const collectionCard: Card = this.findCollectionCard(collection, card);
		// 	return new SetCard(
		// 		card.id,
		// 		card.name,
		// 		card.cardClass,
		// 		card.rarity,
		// 		card.cost,
		// 		collectionCard ? collectionCard.count : 0,
		// 		collectionCard ? collectionCard.premiumCount : 0,
		// 	);
		// });
		const searchResults: readonly string[] = this.cards.searchCards(event.searchString).map(card => card.id);
		const newCollection = navigationState.navigationCollection.update({
			searchResults: searchResults,
		} as NavigationCollection);
		return [
			null,
			navigationState.update({
				isVisible: true,
				navigationCollection: newCollection,
			} as NavigationState),
		];
	}

	// private findCollectionCard(collection: Card[], card: SetCard): Card {
	// 	for (let i = 0; i < collection.length; i++) {
	// 		const collectionCard = collection[i];
	// 		if (collectionCard.id === card.id) {
	// 			return collectionCard;
	// 		}
	// 	}
	// 	return null;
	// }
}
