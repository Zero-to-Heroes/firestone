import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class NavigationNextEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'NavigationNextEvent';
	}

	public eventName(): string {
		return 'NavigationNextEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
