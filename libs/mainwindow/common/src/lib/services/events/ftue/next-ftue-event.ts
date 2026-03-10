import { MainWindowStoreEvent } from '../main-window-store-event';

export class NextFtueEvent implements MainWindowStoreEvent {
	
	readonly eventName = NextFtueEvent.eventName

	static readonly eventName = 'NextFtueEvent'
}
