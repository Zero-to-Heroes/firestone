import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { CollectionInitEvent } from '../../events/collection/collection-init-event';
import { Processor } from '../processor';

export class CollectionInitProcessor implements Processor {
	public async process(event: CollectionInitEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const newCollection = Object.assign(new BinderState(), currentState.binder, event.newState);
		return Object.assign(new MainWindowState(), currentState, {
			binder: newCollection,
		} as MainWindowState);
	}
}
