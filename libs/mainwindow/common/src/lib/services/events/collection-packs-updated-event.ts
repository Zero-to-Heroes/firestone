import { PackResult } from '@firestone-hs/user-packs';
import { MainWindowStoreEvent } from './main-window-store-event';

export class CollectionPacksUpdatedEvent implements MainWindowStoreEvent {
	readonly eventName = CollectionPacksUpdatedEvent.eventName

	constructor(public readonly packs: readonly PackResult[]) {}

	static readonly eventName = 'CollectionPacksUpdatedEvent'
}
