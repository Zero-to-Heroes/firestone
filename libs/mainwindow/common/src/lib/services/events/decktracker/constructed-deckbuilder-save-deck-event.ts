import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedDeckbuilderSaveDeckEvent implements MainWindowStoreEvent {
	
	readonly eventName = ConstructedDeckbuilderSaveDeckEvent.eventName

	static readonly eventName = 'ConstructedDeckbuilderSaveDeckEvent'

	constructor(
		public readonly deckstring: string,
		public readonly deckName: string,
	) {}
}
