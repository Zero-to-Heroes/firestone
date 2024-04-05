import { CollectionNavigationService } from '@firestone/collection/common';
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
	) {}

	public async process(
		event: SelectCollectionSetEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const allSets = await this.setsManager.sets$$.getValueWithInit();
		const selectedSet: Set = allSets.find((set) => set.id === event.setId);

		this.collectionNav.currentView$$.next('cards');

		const newCollection = navigationState.navigationCollection.update({
			menuDisplayType: 'breadcrumbs',
			selectedSetId: event.setId,
			cardList: selectedSet.allCards,
			searchString: undefined,
			selectedCardId: undefined,
			searchResults: [] as readonly string[],
		} as NavigationCollection);
		return [
			null,
			navigationState.update({
				isVisible: true,
				currentApp: 'collection',
				navigationCollection: newCollection,
				text: `global.set.${event.setId}`,
				image: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/sets/${selectedSet.id}.png`,
			} as NavigationState),
		];
	}
}
