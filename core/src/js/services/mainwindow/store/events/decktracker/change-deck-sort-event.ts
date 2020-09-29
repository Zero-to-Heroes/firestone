import { DeckSortType } from '../../../../../models/mainwindow/decktracker/deck-sort.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

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
