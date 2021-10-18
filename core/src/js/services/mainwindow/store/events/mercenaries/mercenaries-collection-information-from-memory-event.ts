import { MemoryMercenariesCollectionInfo } from '../../../../../models/memory/memory-mercenaries-collection-info';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesCollectionInformationFromMemoryEvent implements MainWindowStoreEvent {
	constructor(public readonly info: MemoryMercenariesCollectionInfo) {}

	public static eventName(): string {
		return 'MercenariesCollectionInformationFromMemoryEvent';
	}

	public eventName(): string {
		return 'MercenariesCollectionInformationFromMemoryEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
