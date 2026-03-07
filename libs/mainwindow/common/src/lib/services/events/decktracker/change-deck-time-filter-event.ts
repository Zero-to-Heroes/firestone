import { MainWindowStoreEvent } from '../main-window-store-event';
import { DeckTimeFilterType } from '../../../model/decktracker/deck-time-filter.type';

export class ChangeDeckTimeFilterEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ChangeDeckTimeFilterEvent';
	}

	constructor(public readonly newFormat: DeckTimeFilterType) {}

	public eventName(): string {
		return 'ChangeDeckTimeFilterEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
