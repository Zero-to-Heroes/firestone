import { PackResult } from '@firestone-hs/user-packs';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class CollectionPacksUpdatedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'CollectionPacksUpdatedEvent';
	}

	constructor(public readonly packs: readonly PackResult[]) {}

	public eventName(): string {
		return 'CollectionPacksUpdatedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
