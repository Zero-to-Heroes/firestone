import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class CloseMainWindowEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'CloseMainWindowEvent';
	}

	public eventName(): string {
		return 'CloseMainWindowEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
