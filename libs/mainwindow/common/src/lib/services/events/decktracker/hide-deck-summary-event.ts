import { MainWindowStoreEvent } from '../main-window-store-event';

export class HideDeckSummaryEvent implements MainWindowStoreEvent {
	
	readonly eventName = HideDeckSummaryEvent.eventName

	constructor(public readonly deckstring: string) {}

	static readonly eventName = 'HideDeckSummaryEvent'
}
