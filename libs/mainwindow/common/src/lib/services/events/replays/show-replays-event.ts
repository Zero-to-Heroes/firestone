import { MainWindowStoreEvent } from '../main-window-store-event';

export class ShowReplaysEvent implements MainWindowStoreEvent {
	
	readonly eventName = ShowReplaysEvent.eventName

	constructor(
		public readonly deckstring: string,
		public readonly gameMode: string,
	) {}

	static readonly eventName = 'ShowReplaysEvent'
}
