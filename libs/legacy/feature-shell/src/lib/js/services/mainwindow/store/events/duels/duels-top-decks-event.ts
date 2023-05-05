import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsTopDecksUpdateEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsTopDecksUpdateEvent';
	}

	public eventName(): string {
		return 'DuelsTopDecksUpdateEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
