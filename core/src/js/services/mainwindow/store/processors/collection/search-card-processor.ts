import { Card } from '../../../../../models/card';
import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SetCard } from '../../../../../models/set';
import { CollectionManager } from '../../../../collection/collection-manager.service';
import { SetsService } from '../../../../collection/sets-service.service';
import { SearchCardsEvent } from '../../events/collection/search-cards-event';
import { Processor } from '../processor';

export class SearchCardProcessor implements Processor {
	constructor(private collectionManager: CollectionManager, private cards: SetsService) {}

	public async process(
		event: SearchCardsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const collection = await this.collectionManager.getCollection();
		const searchResults: readonly SetCard[] = this.cards.searchCards(event.searchString, collection).map((card) => {
			const collectionCard: Card = this.findCollectionCard(collection, card);
			return new SetCard(
				card.id,
				card.name,
				card.cardClass,
				card.rarity,
				card.cost,
				collectionCard ? collectionCard.count : 0,
				collectionCard ? collectionCard.premiumCount : 0,
			);
		});
		const newBinder = Object.assign(new BinderState(), currentState.binder, {} as BinderState);
		const newCollection = navigationState.navigationCollection.update({
			currentView: 'cards',
			menuDisplayType: 'breadcrumbs',
			cardList: searchResults,
			searchString: event.searchString,
			searchResults: undefined,
		} as NavigationCollection);
		return [
			Object.assign(new MainWindowState(), currentState, {
				binder: newBinder,
			} as MainWindowState),
			navigationState.update({
				isVisible: true,
				navigationCollection: newCollection,
				text: 'Searching for ' + event.searchString,
				image: null,
			} as NavigationState),
		];
	}

	private findCollectionCard(collection: Card[], card: SetCard): Card {
		for (let i = 0; i < collection.length; i++) {
			const collectionCard = collection[i];
			if (collectionCard.id === card.id) {
				return collectionCard;
			}
		}
		return null;
	}
}
