import { MercenariesPvpMmrFilterType } from '../../../../../models/mercenaries/mercenaries-filter-types';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesPvpMmrFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly mmr: MercenariesPvpMmrFilterType) {}

	public static eventName(): string {
		return 'MercenariesPvpMmrFilterSelectedEvent';
	}

	public eventName(): string {
		return 'MercenariesPvpMmrFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
