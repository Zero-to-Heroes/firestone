import { MainWindowStoreEvent } from '../main-window-store-event';

export class ShowCardDetailsEvent implements MainWindowStoreEvent {
	
	readonly eventName = ShowCardDetailsEvent.eventName

	constructor(cardId: string) {
		this.cardId = cardId;
	}
	readonly cardId: string;

	static readonly eventName = 'ShowCardDetailsEvent'
}
