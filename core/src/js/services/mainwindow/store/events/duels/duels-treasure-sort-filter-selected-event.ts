import { DuelsTreasureSortFilterType } from '../../../../../models/duels/duels-treasure-sort-filter.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsTreasureSortFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsTreasureSortFilterSelectedEvent';
	}

	constructor(public readonly value: DuelsTreasureSortFilterType) {}

	public eventName(): string {
		return 'DuelsTreasureSortFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
