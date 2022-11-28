import { DeckInfoFromMemory } from '@models/mainwindow/decktracker/deck-info-from-memory';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsCurrentDeckEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsCurrentDeckEvent';
	}

	constructor(public readonly deck: DeckInfoFromMemory) {}

	public eventName(): string {
		return 'DuelsCurrentDeckEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
