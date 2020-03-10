import { MainWindowStoreEvent } from '../main-window-store-event';

export class NextFtueEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'NextFtueEvent';
	}

	public eventName(): string {
		return 'NextFtueEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
