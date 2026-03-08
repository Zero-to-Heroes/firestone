import { MainWindowStoreEvent } from '../../events';
import { MainWindowState, NavigationState } from '../../../model/_barrel';

export interface Processor {
	process(
		event: MainWindowStoreEvent,
		state: MainWindowState,
		navigationState?: NavigationState,
	): Promise<[MainWindowState | null, NavigationState | null]>;
}
