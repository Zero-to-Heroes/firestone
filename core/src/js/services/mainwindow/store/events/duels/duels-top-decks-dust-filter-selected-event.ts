import { DuelsTopDecksDustFilterType } from '../../../../../models/duels/duels-types';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsTopDecksDustFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsTopDecksDustFilterSelectedEvent';
	}

	constructor(public readonly value: DuelsTopDecksDustFilterType) {}

	public eventName(): string {
		return 'DuelsTopDecksDustFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
