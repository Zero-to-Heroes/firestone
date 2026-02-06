import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class GamesFullClearEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'GamesFullClearEvent';
	}

	public eventName(): string {
		return 'GamesFullClearEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
