import { MainWindowStoreEvent } from '../main-window-store-event';
import { DeckSortType } from '../../../model/decktracker/deck-sort.type';

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
