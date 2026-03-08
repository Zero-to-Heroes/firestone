import { CollectionNavigationService, Set } from '@firestone/collection/common';
import { SetsManagerService } from '@firestone/collection/services';
import {
	MainWindowNavigationService,
	MainWindowState,
	NavigationCollection,
	NavigationState,
	SelectCollectionSetEvent,
} from '../../store-internal';
import { Processor } from '../processor';

export class SelectCollectionSetProcessor implements Processor {
	constructor(
		private readonly setsManager: SetsManagerService,
		private readonly collectionNav: CollectionNavigationService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: SelectCollectionSetEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		const allSets = await this.setsManager.sets$$.getValueWithInit();
		const selectedSet = allSets.find((set) => set.id === event.setId);
		if (!selectedSet) {
			return [null, null];
		}

		this.collectionNav.currentView$$.next('cards');
		this.collectionNav.menuDisplayType$$.next('breadcrumbs');
		this.collectionNav.searchString$$.next(null);
		this.collectionNav.selectedSetId$$.next(event.setId);
		this.collectionNav.selectedCardId$$.next(null);

		const newCollection = navigationState.navigationCollection.update({
			cardList: selectedSet.allCards,
			searchResults: [] as readonly string[],
		} as NavigationCollection);
		this.mainNav.text$$.next(`global.set.${event.setId}`);
		this.mainNav.image$$.next(
			`https://static.zerotoheroes.com/hearthstone/asset/firestone/images/sets/${selectedSet.id}.png`,
		);
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
