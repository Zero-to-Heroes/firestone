import { DeckSummary } from '../../../../../models/mainwindow/decktracker/deck-summary';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedEjectDeckVersionEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ConstructedEjectDeckVersionEvent';
	}

	constructor(public readonly deckstringToEject: string, public readonly deck: DeckSummary) {}

	public eventName(): string {
		return 'ConstructedEjectDeckVersionEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
