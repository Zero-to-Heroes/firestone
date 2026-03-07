import { MainWindowStoreEvent } from '../main-window-store-event';
import { DeckRankFilterType } from '@firestone/shared/common/service';

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
