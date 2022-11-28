import { MainWindowStoreEvent } from '../main-window-store-event';

export class SkipFtueEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'SkipFtueEvent';
	}

	public eventName(): string {
		return 'SkipFtueEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
