import { MainWindowStoreEvent } from '../main-window-store-event';

export class ShowCardBackDetailsEvent implements MainWindowStoreEvent {
	
	readonly eventName = ShowCardBackDetailsEvent.eventName

	constructor(public readonly cardBackId: number) {}

	static readonly eventName = 'ShowCardBackDetailsEvent'
}
