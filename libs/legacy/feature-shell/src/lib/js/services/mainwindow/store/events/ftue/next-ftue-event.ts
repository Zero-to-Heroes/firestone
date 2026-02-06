import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

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
