import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
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
			currentState.update({
				binder: newCollection,
			} as MainWindowState),
			null,
		];
	}
}
