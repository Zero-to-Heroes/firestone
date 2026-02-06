import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { StatsXpGraphSeasonFilterType } from '@firestone/mainwindow/common';

export class StatsXpGraphFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'StatsXpGraphFilterSelectedEvent';
	}

	constructor(public readonly value: StatsXpGraphSeasonFilterType) {}

	public eventName(): string {
		return 'StatsXpGraphFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
