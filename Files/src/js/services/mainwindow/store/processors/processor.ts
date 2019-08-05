import { MainWindowStoreEvent } from '../events/main-window-store-event';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';

export abstract class Processor {
	abstract async process(event: MainWindowStoreEvent, state: MainWindowState): Promise<MainWindowState>;
}
