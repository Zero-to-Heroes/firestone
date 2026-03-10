import { DeckSummary } from '@firestone/constructed/common';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedEjectDeckVersionEvent implements MainWindowStoreEvent {
	
	readonly eventName = ConstructedEjectDeckVersionEvent.eventName

	static readonly eventName = 'ConstructedEjectDeckVersionEvent'

	constructor(
		public readonly deckstringToEject: string,
		public readonly deck: DeckSummary,
	) {}
}
