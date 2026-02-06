import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

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
