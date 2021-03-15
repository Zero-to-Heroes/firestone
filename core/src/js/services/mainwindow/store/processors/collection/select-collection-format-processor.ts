import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { SelectCollectionFormatEvent } from '../../events/collection/select-collection-format-event';
import { Processor } from '../processor';

export class SelectCollectionFormatProcessor implements Processor {
	public async process(
		event: SelectCollectionFormatEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newCollection = navigationState.navigationCollection.update({
			currentView: 'sets',
			menuDisplayType: 'menu',
			selectedSetId: undefined,
			selectedFormat: event.format,
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
			} as NavigationState),
		];
	}
}
