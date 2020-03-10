import { MainWindowStoreEvent } from '../main-window-store-event';

export class PreviousFtueEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'PreviousFtueEvent';
	}

	public eventName(): string {
		return 'PreviousFtueEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
