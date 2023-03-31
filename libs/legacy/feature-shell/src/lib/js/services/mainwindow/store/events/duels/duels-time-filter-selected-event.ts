import { DuelsTimeFilterType } from '@firestone/duels/data-access';
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
