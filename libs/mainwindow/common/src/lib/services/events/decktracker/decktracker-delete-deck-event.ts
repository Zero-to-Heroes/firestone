import { MainWindowStoreEvent } from '../main-window-store-event';

export class DecktrackerDeleteDeckEvent implements MainWindowStoreEvent {
	
	readonly eventName = DecktrackerDeleteDeckEvent.eventName

	constructor(public readonly deckstring: string) {}

	static readonly eventName = 'DecktrackerDeleteDeckEvent'
}
