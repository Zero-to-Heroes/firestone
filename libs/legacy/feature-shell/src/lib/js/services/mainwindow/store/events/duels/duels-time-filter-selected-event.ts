import { DuelsTimeFilterType } from '../../../../../models/duels/duels-time-filter.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsTimeFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsTimeFilterSelectedEvent';
	}

	constructor(public readonly value: DuelsTimeFilterType) {}

	public eventName(): string {
		return 'DuelsTimeFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
