import { MemoryMercenariesInfo } from '../../../../../models/memory/memory-mercenaries-info';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesMapInformationFromMemoryEvent implements MainWindowStoreEvent {
	constructor(public readonly info: MemoryMercenariesInfo) {}

	public static eventName(): string {
		return 'MercenariesMapInformationFromMemoryEvent';
	}

	public eventName(): string {
		return 'MercenariesMapInformationFromMemoryEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
