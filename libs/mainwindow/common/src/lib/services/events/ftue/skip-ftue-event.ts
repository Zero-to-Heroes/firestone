import { MainWindowStoreEvent } from '../main-window-store-event';

export class SkipFtueEvent implements MainWindowStoreEvent {
	
	readonly eventName = SkipFtueEvent.eventName

	static readonly eventName = 'SkipFtueEvent'
}
