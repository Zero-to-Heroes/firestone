import { CollectionNavigationService } from '@firestone/collection/common';
import { CardBack } from '@firestone/memory';
import { CollectionManager } from '@firestone/collection/services';
import {
	MainWindowNavigationService,
	MainWindowState,
	NavigationCollection,
	NavigationState,
	ShowCardBackDetailsEvent,
} from '../../store-internal';
import { Processor } from '../processor';

export class ShowCardBackDetailsProcessor implements Processor {
	constructor(
		private readonly collectionManager: CollectionManager,
		private readonly collectionNav: CollectionNavigationService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: ShowCardBackDetailsEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const cardBacks = await this.collectionManager.cardBacks$$.getValueWithInit();
		const selectedCardBack = cardBacks.find((cardBack) => cardBack.id === event.cardBackId);
		if (!selectedCardBack) {
			return [null, null];
		}

		this.collectionNav.currentView$$.next('card-back-details');
		this.collectionNav.menuDisplayType$$.next('breadcrumbs');
		this.collectionNav.searchString$$.next(null);
		this.collectionNav.selectedCardId$$.next(null);
		this.collectionNav.selectedCardBackId$$.next(event.cardBackId);

		const newCollection = navigationState.navigationCollection.update({
			searchResults: [] as readonly string[],
		} as NavigationCollection);
		this.mainNav.text$$.next(selectedCardBack.name);
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
}
