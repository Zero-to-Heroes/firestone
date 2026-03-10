import { MainWindowStoreEvent } from '../main-window-store-event';

export class RestoreDeckSummaryEvent implements MainWindowStoreEvent {
	
	readonly eventName = RestoreDeckSummaryEvent.eventName

	constructor(public readonly deckstring: string) {}

	static readonly eventName = 'RestoreDeckSummaryEvent'
}
