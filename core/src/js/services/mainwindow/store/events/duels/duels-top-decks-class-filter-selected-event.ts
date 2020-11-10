import { DuelsClassFilterType } from '../../../../../models/duels/duels-class-filter.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsTopDecksClassFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsTopDecksClassFilterSelectedEvent';
	}

	constructor(public readonly value: DuelsClassFilterType) {}

	public eventName(): string {
		return 'DuelsTopDecksClassFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
