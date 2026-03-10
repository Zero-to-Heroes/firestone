import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedNewDeckVersionEvent implements MainWindowStoreEvent {
	
	readonly eventName = ConstructedNewDeckVersionEvent.eventName

	static readonly eventName = 'ConstructedNewDeckVersionEvent'

	constructor(
		public readonly newVersionDeckstring: string,
		public readonly previousVersionDeckstring,
	) {}
}
