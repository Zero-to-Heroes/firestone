import { MainWindowStoreEvent } from '../main-window-store-event';

export class TriggerShowMatchStatsEvent implements MainWindowStoreEvent {
	
	readonly eventName = TriggerShowMatchStatsEvent.eventName

	constructor(public readonly reviewId: string) {}

	static readonly eventName = 'TriggerShowMatchStatsEvent'
}
