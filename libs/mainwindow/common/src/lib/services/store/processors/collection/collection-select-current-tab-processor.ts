import { CollectionNavigationService } from '@firestone/collection/common';
import {
	CollectionSelectCurrentTabEvent,
	MainWindowNavigationService,
	MainWindowState,
	NavigationCollection,
	NavigationState,
} from '../../store-internal';
import { Processor } from '../processor';

export class CollectionSelectCurrentTabProcessor implements Processor {
	constructor(
		private readonly collectionNav: CollectionNavigationService,
		private readonly mainNav: MainWindowNavigationService,
	) {}

	public async process(
		event: CollectionSelectCurrentTabEvent,
		currentState: MainWindowState,
		navigationState: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]> {
		this.collectionNav.currentView$$.next(event.tab);
		this.collectionNav.menuDisplayType$$.next('menu');
		this.collectionNav.searchString$$.next(null);
		this.collectionNav.selectedSetId$$.next(null);
		this.collectionNav.selectedCardId$$.next(null);
		const newCollection = navigationState.navigationCollection.update({
			searchResults: [] as readonly string[],
		} as NavigationCollection);
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
