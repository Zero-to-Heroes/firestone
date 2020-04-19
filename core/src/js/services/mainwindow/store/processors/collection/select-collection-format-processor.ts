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
			selectedSet: undefined,
			selectedFormat: event.format,
			searchString: undefined,
			selectedCard: undefined,
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
