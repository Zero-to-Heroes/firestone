import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class GamesFullRefreshEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'GamesFullRefreshEvent';
	}

	public eventName(): string {
		return 'GamesFullRefreshEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
