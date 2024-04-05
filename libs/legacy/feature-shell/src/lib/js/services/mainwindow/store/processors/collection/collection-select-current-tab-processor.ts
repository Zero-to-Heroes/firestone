import { CollectionNavigationService } from '@firestone/collection/common';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CollectionSelectCurrentTabEvent } from '../../events/collection/collection-select-current-tab-event';
import { Processor } from '../processor';

export class CollectionSelectCurrentTabProcessor implements Processor {
	constructor(private readonly collectionNav: CollectionNavigationService) {}

	public async process(
		event: CollectionSelectCurrentTabEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.collectionNav.currentView$$.next(event.tab);
		this.collectionNav.menuDisplayType$$.next('menu');
		this.collectionNav.searchString$$.next(null);
		this.collectionNav.selectedSetId$$.next(null);
		this.collectionNav.selectedCardId$$.next(null);
		const newCollection = navigationState.navigationCollection.update({
			searchResults: [] as readonly string[],
		} as NavigationCollection);
		return [
			null,
			navigationState.update({
				isVisible: true,
				currentApp: 'collection',
				navigationCollection: newCollection,
			} as NavigationState),
		];
	}
}
