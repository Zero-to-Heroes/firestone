import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class ShowMainWindowEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ShowMainWindowEvent';
	}

	public eventName(): string {
		return 'ShowMainWindowEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
