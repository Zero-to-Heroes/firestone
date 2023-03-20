import { LocalizationService } from '@services/localization.service';
import { Card } from '../../../../../models/card';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SetCard } from '../../../../../models/set';
import { CollectionManager } from '../../../../collection/collection-manager.service';
import { SetsService } from '../../../../collection/sets-service.service';
import { SearchCardsEvent } from '../../events/collection/search-cards-event';
import { Processor } from '../processor';

declare let amplitude;

export class SearchCardProcessor implements Processor {
	constructor(
		private collectionManager: CollectionManager,
		private cards: SetsService,
		private readonly i18n: LocalizationService,
	) {}

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

		if (event.searchString?.length) {
			amplitude.getInstance().logEvent('search', {
				page: 'collection',
			});
		}
		const newCollection = navigationState.navigationCollection.update({
			currentView: 'cards',
			menuDisplayType: 'breadcrumbs',
			cardList: searchResults,
			searchString: event.searchString,
			searchResults: undefined,
		} as NavigationCollection);
		return [
			null,
			navigationState.update({
				isVisible: true,
				navigationCollection: newCollection,
				text: this.i18n.translateString('app.collection.card-search.results-title', {
					value: event.searchString,
				}),
				image: null,
			} as NavigationState),
		];
	}

	private findCollectionCard(collection: readonly Card[], card: SetCard): Card {
		for (let i = 0; i < collection.length; i++) {
			const collectionCard = collection[i];
			if (collectionCard.id === card.id) {
				return collectionCard;
			}
		}
		return null;
	}
}
