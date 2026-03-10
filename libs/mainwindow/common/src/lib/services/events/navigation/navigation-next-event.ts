import { MainWindowStoreEvent } from '../main-window-store-event';

export class NavigationNextEvent implements MainWindowStoreEvent {
	readonly eventName = NavigationNextEvent.eventName

	static readonly eventName = 'NavigationNextEvent'
}
