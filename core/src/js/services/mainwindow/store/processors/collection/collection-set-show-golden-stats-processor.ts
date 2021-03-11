import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CollectionSetShowGoldenStatsEvent } from '../../events/collection/collection-set-show-golden-stats-event';
import { Processor } from '../processor';

export class CollectionSetShowGoldenStatsProcessor implements Processor {
	public async process(
		event: CollectionSetShowGoldenStatsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newCollection = navigationState.navigationCollection.update({
			collectionSetShowGoldenStats: event.newValue,
		} as NavigationCollection);
		return [
			null,
			navigationState.update({
				navigationCollection: newCollection,
			} as NavigationState),
		];
	}
}
