import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { Set } from '../../../../../models/set';
import { SelectCollectionSetEvent } from '../../events/collection/select-collection-set-event';
import { Processor } from '../processor';

export class SelectCollectionSetProcessor implements Processor {
	public async process(
		event: SelectCollectionSetEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const selectedSet: Set = currentState.binder.allSets.find((set) => set.id === event.setId);
		const newCollection = navigationState.navigationCollection.update({
			currentView: 'cards',
			menuDisplayType: 'breadcrumbs',
			selectedSetId: event.setId,
			selectedFormat: selectedSet
				? selectedSet.standard
					? 'standard'
					: 'wild'
				: navigationState.navigationCollection.selectedFormat,
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
				text: selectedSet.name,
				image: `assets/images/sets/${selectedSet.id}.png`,
			} as NavigationState),
		];
	}
}
