import { CollectionNavigationService, SetCard } from '@firestone/collection/common';
import { SetsService } from '@firestone/collection/data-access';
import { CollectionManager } from '@firestone/collection/services';
import { Card } from '@firestone/memory';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { MainWindowNavigationService, MainWindowState, NavigationState, SearchCardsEvent } from '../../store-internal';
import { Processor } from '../processor';

export class SearchCardProcessor implements Processor {
	constructor(
		private readonly collectionManager: CollectionManager,
		private readonly cards: SetsService,
		private readonly i18n: ILocalizationService,
		private readonly collectionNav: CollectionNavigationService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: SearchCardsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const collection = (await this.collectionManager.collection$$.getValueWithInit()) ?? [];
		const searchResults: readonly SetCard[] = this.cards.searchCards(event.searchString, collection).map((card) => {
			const collectionCard = this.findCollectionCard(collection, card);
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
		});
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

	private findCollectionCard(collection: readonly Card[], card: SetCard): Card | null {
		for (let i = 0; i < collection.length; i++) {
			const collectionCard = collection[i];
			if (collectionCard.id === card.id) {
				return collectionCard;
			}
		}
		return null;
	}
}
