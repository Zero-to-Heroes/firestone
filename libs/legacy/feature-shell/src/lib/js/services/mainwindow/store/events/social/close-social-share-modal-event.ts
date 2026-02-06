import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class CloseSocialShareModalEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'CloseSocialShareModalEvent';
	}

	public eventName(): string {
		return 'CloseSocialShareModalEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
