import { MainWindowStoreEvent } from '../main-window-store-event';
import { DeckRankingCategoryType } from '@firestone/shared/common/service';

export class ChangeDeckRankCategoryFilterEvent implements MainWindowStoreEvent {
	constructor(public readonly newRank: DeckRankingCategoryType) {}

	public static eventName(): string {
		return 'ChangeDeckRankCategoryFilterEvent';
	}

	public eventName(): string {
		return 'ChangeDeckRankCategoryFilterEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
