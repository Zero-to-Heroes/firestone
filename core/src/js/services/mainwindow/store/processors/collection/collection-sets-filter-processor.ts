import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CollectionSetsFilterEvent } from '../../events/collection/collection-sets-filter-event';
import { Processor } from '../processor';

export class CollectionSetsFilterProcessor implements Processor {
	public async process(
		event: CollectionSetsFilterEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newCollection = navigationState.navigationCollection.update({
			selectedFormat: event.value,
		} as NavigationCollection);
		return [
			null,
			navigationState.update({
				navigationCollection: newCollection,
			} as NavigationState),
		];
	}
}
