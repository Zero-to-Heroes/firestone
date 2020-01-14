import { Card } from '../../../../../models/card';
import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { Navigation } from '../../../../../models/mainwindow/navigation';
import { SetCard } from '../../../../../models/set';
import { CollectionManager } from '../../../../collection/collection-manager.service';
import { SetsService } from '../../../../sets-service.service';
import { SearchCardsEvent } from '../../events/collection/search-cards-event';
import { Processor } from '../processor';

export class SearchCardProcessor implements Processor {
	constructor(private collectionManager: CollectionManager, private cards: SetsService) {}

	public async process(event: SearchCardsEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const collection = await this.collectionManager.getCollection();
		const searchResults: readonly SetCard[] = this.cards.searchCards(event.searchString).map(card => {
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
		const newBinder = Object.assign(new BinderState(), currentState.binder, {
			currentView: 'cards',
			menuDisplayType: 'breadcrumbs',
			cardList: searchResults,
			searchString: event.searchString,
			searchResults: undefined,
		} as BinderState);
		return Object.assign(new MainWindowState(), currentState, {
			binder: newBinder,
			isVisible: true,
			navigation: Object.assign(new Navigation(), currentState.navigation, {
				text: 'Searching for ' + event.searchString,
				image: null,
			} as Navigation),
		} as MainWindowState);
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
