import { CollectionNavigationService } from '@firestone/collection/common';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { Card } from '@firestone/memory';
import { LocalizationService } from '@services/localization.service';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SetCard } from '../../../../../models/set';
import { CollectionManager } from '../../../../collection/collection-manager.service';
import { SetsService } from '../../../../collection/sets-service.service';
import { SearchCardsEvent } from '../../events/collection/search-cards-event';
import { Processor } from '../processor';

export class SearchCardProcessor implements Processor {
	constructor(
		private readonly collectionManager: CollectionManager,
		private readonly cards: SetsService,
		private readonly i18n: LocalizationService,
		private readonly collectionNav: CollectionNavigationService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: SearchCardsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const collection = (await this.collectionManager.collection$$.getValueWithInit()) ?? [];
		const searchResults: readonly SetCard[] = this.cards.searchCards(event.searchString, collection).map((card) => {
			const collectionCard: Card = this.findCollectionCard(collection, card);
			return new SetCard(
				card.id,
				card.name,
				card.classes,
				card.rarity,
				card.cost,
				collectionCard?.count ?? 0,
				collectionCard?.premiumCount ?? 0,
				collectionCard?.diamondCount ?? 0,
				collectionCard?.signatureCount ?? 0,
			);
		});

		this.collectionNav.currentView$$.next('cards');
		this.collectionNav.menuDisplayType$$.next('breadcrumbs');
		this.collectionNav.searchString$$.next(event.searchString);

		const newCollection = navigationState.navigationCollection.update({
			cardList: searchResults,
			searchResults: undefined,
		} as NavigationCollection);
		this.mainNav.text$$.next(
			this.i18n.translateString('app.collection.card-search.results-title', {
				value: event.searchString,
			}),
		);
		this.mainNav.image$$.next(null);
		this.mainNav.isVisible$$.next(true);
		return [
			null,
			navigationState.update({
				navigationCollection: newCollection,
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
