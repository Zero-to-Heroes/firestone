import { CollectionNavigationService, Set } from '@firestone/collection/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { SetsManagerService } from '@firestone/collection/services';
import {
	MainWindowNavigationService,
	MainWindowState,
	NavigationCollection,
	NavigationState,
	ShowCardDetailsEvent,
} from '../../store-internal';
import { Processor } from '../processor';

export class ShowCardDetailsProcessor implements Processor {
	constructor(
		private readonly cards: CardsFacadeService,
		private readonly setsManager: SetsManagerService,
		private readonly collectionNav: CollectionNavigationService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: ShowCardDetailsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const allSets = await this.setsManager.sets$$.getValueWithInit();
		const selectedSet = this.pickSet(allSets, event.cardId);
		if (!selectedSet) {
			return [null, null];
		}
		const referenceCard = this.cards.getCard(event.cardId);
		this.collectionNav.currentView$$.next('card-details');
		this.collectionNav.menuDisplayType$$.next('breadcrumbs');
		this.collectionNav.searchString$$.next(null);
		this.collectionNav.selectedSetId$$.next(selectedSet.id);
		this.collectionNav.selectedCardId$$.next(event.cardId);
		this.collectionNav.selectedCardBackId$$.next(null);
		const newCollection = navigationState.navigationCollection.update({
			searchResults: [] as readonly string[],
		} as NavigationCollection);

		this.mainNav.text$$.next(referenceCard.name);
		this.mainNav.image$$.next(null);
		this.mainNav.isVisible$$.next(true);
		this.mainNav.currentApp$$.next('collection');
		return [
			null,
			navigationState.update({
				navigationCollection: newCollection,
			} as NavigationState),
		];
	}

	private pickSet(allSets: readonly Set[], cardId: string): Set | undefined {
		let set = allSets.find((s) => !!s.getCard(cardId));
		// Happens when cardId is not collectible
		if (!set) {
			const card = this.cards.getCard(cardId);
			const setId = card.set.toLowerCase();
			set = allSets.find((s) => s.id === setId);
		}
		return set;
	}
}
