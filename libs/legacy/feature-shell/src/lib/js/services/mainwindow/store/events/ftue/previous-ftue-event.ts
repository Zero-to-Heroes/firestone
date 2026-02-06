import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

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
