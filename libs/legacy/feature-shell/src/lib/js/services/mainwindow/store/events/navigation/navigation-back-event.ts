import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class NavigationBackEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'NavigationBackEvent';
	}

	public eventName(): string {
		return 'NavigationBackEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
