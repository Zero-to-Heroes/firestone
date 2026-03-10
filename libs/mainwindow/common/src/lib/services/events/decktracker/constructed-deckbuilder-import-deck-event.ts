import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedDeckbuilderImportDeckEvent implements MainWindowStoreEvent {
	
	readonly eventName = ConstructedDeckbuilderImportDeckEvent.eventName

	static readonly eventName = 'ConstructedDeckbuilderImportDeckEvent'

	constructor(
		public readonly deckstring: string,
		public readonly deckName: string,
	) {}
}
