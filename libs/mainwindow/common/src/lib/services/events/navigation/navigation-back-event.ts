import { MainWindowStoreEvent } from '../main-window-store-event';

export class NavigationBackEvent implements MainWindowStoreEvent {
	readonly eventName = NavigationBackEvent.eventName

	static readonly eventName = 'NavigationBackEvent'
}
