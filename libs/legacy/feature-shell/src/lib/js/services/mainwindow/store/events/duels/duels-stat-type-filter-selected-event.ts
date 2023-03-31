import { DuelsStatTypeFilterType } from '@firestone/duels/data-access';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsStatTypeFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsStatTypeFilterSelectedEvent';
	}

	constructor(public readonly value: DuelsStatTypeFilterType) {}

	public eventName(): string {
		return 'DuelsStatTypeFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
