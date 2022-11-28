import { DeckStat } from '@firestone-hs/deck-stats';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedMetaDecksLoadedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ConstructedMetaDecksLoadedEvent';
	}

	constructor(public readonly decks: readonly DeckStat[]) {}

	public eventName(): string {
		return 'ConstructedMetaDecksLoadedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
