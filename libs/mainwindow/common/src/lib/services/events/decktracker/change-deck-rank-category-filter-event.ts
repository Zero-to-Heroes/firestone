import { MainWindowStoreEvent } from '../main-window-store-event';
import { DeckRankingCategoryType } from '@firestone/shared/common/service';

export class ChangeDeckRankCategoryFilterEvent implements MainWindowStoreEvent {
	
	readonly eventName = ChangeDeckRankCategoryFilterEvent.eventName

	constructor(public readonly newRank: DeckRankingCategoryType) {}

	static readonly eventName = 'ChangeDeckRankCategoryFilterEvent'
}
