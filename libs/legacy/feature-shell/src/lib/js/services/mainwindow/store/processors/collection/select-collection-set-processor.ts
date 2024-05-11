import { CollectionNavigationService } from '@firestone/collection/common';
import { MainWindowNavigationService } from '@firestone/mainwindow/common';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Set } from '../../../../../models/set';
import { SetsManagerService } from '../../../../collection/sets-manager.service';
import { SelectCollectionSetEvent } from '../../events/collection/select-collection-set-event';
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
	): Promise<[MainWindowState, NavigationState]> {
		const allSets = await this.setsManager.sets$$.getValueWithInit();
		const selectedSet: Set = allSets.find((set) => set.id === event.setId);

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
		return [
			null,
			navigationState.update({
				currentApp: 'collection',
				navigationCollection: newCollection,
			} as NavigationState),
		];
	}
}
