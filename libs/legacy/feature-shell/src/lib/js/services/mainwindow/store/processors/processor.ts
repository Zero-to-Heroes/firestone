import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { MainWindowState, NavigationState } from '@firestone/mainwindow/common';

export interface Processor {
	process(
		event: MainWindowStoreEvent,
		state: MainWindowState,
		navigationState?: NavigationState,
	): Promise<[MainWindowState, NavigationState]>;
}
