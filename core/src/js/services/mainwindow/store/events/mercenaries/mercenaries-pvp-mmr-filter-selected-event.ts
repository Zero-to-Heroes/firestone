import { MercenariesPvpMmrFilterType } from '../../../../../models/mercenaries/mercenaries-pvp-mmr-filter.type';
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
