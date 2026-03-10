import { MainWindowStoreEvent } from '../main-window-store-event';
import { DeckRankFilterType } from '@firestone/shared/common/service';

export class ChangeDeckRankFilterEvent implements MainWindowStoreEvent {
	
	readonly eventName = ChangeDeckRankFilterEvent.eventName

	constructor(public readonly newRank: DeckRankFilterType) {}

	static readonly eventName = 'ChangeDeckRankFilterEvent'
}
