import { BinderState } from '../../../../../models/mainwindow/binder-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { CollectionSetsFilterEvent } from '../../events/collection/collection-sets-filter-event';
import { Processor } from '../processor';

export class CollectionSetsFilterProcessor implements Processor {
	constructor() {}

	public async process(event: CollectionSetsFilterEvent, currentState: MainWindowState): Promise<MainWindowState> {
		const newCollection = Object.assign(new BinderState(), currentState.binder, {
			selectedFormat: event.value,
		} as BinderState);
		return Object.assign(new MainWindowState(), currentState, {
			binder: newCollection,
		} as MainWindowState);
	}
}
