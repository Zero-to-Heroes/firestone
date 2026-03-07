import {
	MainWindowNavigationService,
	MainWindowState,
	NavigationCollection,
	NavigationState,
} from '@firestone/mainwindow/common';
import { CollectionManager } from '../../../../collection/collection-manager.service';
import { SetsService } from '@firestone/collection/data-access';
import { UpdateCardSearchResultsEvent } from '../../events/collection/update-card-search-results-event';
import { Processor } from '../processor';

export class UpdateCardSearchResultsProcessor implements Processor {
	constructor(
		private collectionManager: CollectionManager,
		private cards: SetsService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: UpdateCardSearchResultsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const collection = (await this.collectionManager.collection$$.getValueWithInit()) ?? [];
		const searchResults: readonly string[] = this.cards
			.searchCards(event.searchString, collection)
			.map((card) => card.id);
		const newCollection = navigationState.navigationCollection.update({
			searchResults: searchResults,
		} as NavigationCollection);
		this.mainNav.isVisible$$.next(true);
		return [
			null,
			navigationState.update({
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
