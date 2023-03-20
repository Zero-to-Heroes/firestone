import { DuelsHeroSortFilterType } from '@firestone/duels/view';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsTreasureSortFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsTreasureSortFilterSelectedEvent';
	}

	constructor(public readonly value: DuelsHeroSortFilterType) {}

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
