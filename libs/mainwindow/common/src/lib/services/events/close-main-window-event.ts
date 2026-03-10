import { MainWindowStoreEvent } from './main-window-store-event';

export class CloseMainWindowEvent implements MainWindowStoreEvent {
	readonly eventName = CloseMainWindowEvent.eventName

	static readonly eventName = 'CloseMainWindowEvent'
}
