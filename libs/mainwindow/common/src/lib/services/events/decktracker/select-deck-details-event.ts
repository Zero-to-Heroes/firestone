import { MainWindowStoreEvent } from '../main-window-store-event';

export class SelectDeckDetailsEvent implements MainWindowStoreEvent {
	
	readonly eventName = SelectDeckDetailsEvent.eventName

	constructor(public readonly deckstring: string) {}

	static readonly eventName = 'SelectDeckDetailsEvent'
}
