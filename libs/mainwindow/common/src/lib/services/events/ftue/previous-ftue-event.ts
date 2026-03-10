import { MainWindowStoreEvent } from '../main-window-store-event';

export class PreviousFtueEvent implements MainWindowStoreEvent {
	
	readonly eventName = PreviousFtueEvent.eventName

	static readonly eventName = 'PreviousFtueEvent'
}
