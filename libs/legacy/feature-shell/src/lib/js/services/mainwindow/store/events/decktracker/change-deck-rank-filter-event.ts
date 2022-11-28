import { DeckRankFilterType } from '../../../../../models/mainwindow/decktracker/deck-rank-filter.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class ChangeDeckRankFilterEvent implements MainWindowStoreEvent {
	constructor(public readonly newRank: DeckRankFilterType) {}

	public static eventName(): string {
		return 'ChangeDeckRankFilterEvent';
	}

	public eventName(): string {
		return 'ChangeDeckRankFilterEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
