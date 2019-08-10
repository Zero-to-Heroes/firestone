import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { MainWindowStoreEvent } from '../events/main-window-store-event';
import { StateHistory } from '../state-history';

export interface Processor {
	process(event: MainWindowStoreEvent, state: MainWindowState, history?: readonly StateHistory[]): Promise<MainWindowState>;
}
