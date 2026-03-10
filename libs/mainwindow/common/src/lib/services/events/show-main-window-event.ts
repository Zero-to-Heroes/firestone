import { MainWindowStoreEvent } from './main-window-store-event';

export class ShowMainWindowEvent implements MainWindowStoreEvent {
	static readonly eventName = 'ShowMainWindowEvent';

	readonly eventName = ShowMainWindowEvent.eventName;
}
