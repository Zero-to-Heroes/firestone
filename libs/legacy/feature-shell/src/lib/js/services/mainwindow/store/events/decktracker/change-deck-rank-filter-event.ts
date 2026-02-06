import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { DeckRankFilterType } from '@firestone/mainwindow/common';

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
