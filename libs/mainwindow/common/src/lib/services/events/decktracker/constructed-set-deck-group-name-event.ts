import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedSetDeckGroupNameEvent implements MainWindowStoreEvent {
	readonly eventName = ConstructedSetDeckGroupNameEvent.eventName;

	static readonly eventName = 'ConstructedSetDeckGroupNameEvent';

	/**
	 * Any deckstring that belongs to the version group (primary or a version).
	 */
	constructor(
		public readonly deckstringInGroup: string,
		public readonly groupName: string,
	) {}
}
