import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { MainWindowStoreEvent } from '../events/main-window-store-event';

export interface Processor {
	process(
		event: MainWindowStoreEvent,
		state: MainWindowState,
		navigationState?: NavigationState,
	): Promise<[MainWindowState, NavigationState]>;
}
