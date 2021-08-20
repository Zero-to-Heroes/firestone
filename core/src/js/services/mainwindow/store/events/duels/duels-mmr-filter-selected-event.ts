import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsMmrFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsMmrFilterSelectedEvent';
	}

	constructor(public readonly value: 100 | 50 | 25 | 10 | 1) {}

	public eventName(): string {
		return 'DuelsMmrFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
