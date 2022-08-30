import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsPassivesFilterSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsPassivesFilterSelectedEvent';
	}

	constructor(public readonly value: readonly string[]) {}

	public eventName(): string {
		return 'DuelsPassivesFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
