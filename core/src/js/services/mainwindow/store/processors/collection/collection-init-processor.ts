import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationCollection } from '../../../../../models/mainwindow/navigation/navigation-collection';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { CollectionInitEvent } from '../../events/collection/collection-init-event';
import { Processor } from '../processor';

export class CollectionInitProcessor implements Processor {
	public async process(
		event: CollectionInitEvent,
		currentState: MainWindowState,
		history,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const newCollection = Object.assign(new BinderState(), currentState.binder, event.newState);
		return [
			Object.assign(new MainWindowState(), currentState, {
				binder: newCollection,
			} as MainWindowState),
			navigationState.update({
				navigationCollection: navigationState.navigationCollection.update({
					shownCardHistory: newCollection.cardHistory,
				} as NavigationCollection),
			} as NavigationState),
		];
	}
}
