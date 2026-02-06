import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { DeckSortType } from '@firestone/mainwindow/common';

export class ChangeDeckSortEvent implements MainWindowStoreEvent {
	constructor(public readonly sort: DeckSortType) {}

	public static eventName(): string {
		return 'ChangeDeckSortEvent';
	}

	public eventName(): string {
		return 'ChangeDeckSortEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
