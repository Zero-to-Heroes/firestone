import { MainWindowStoreEvent } from '../main-window-store-event';
import { MmrGroupFilterType } from '@firestone/shared/common/service';

export class ChangeDeckRankGroupEvent implements MainWindowStoreEvent {
	
	readonly eventName = ChangeDeckRankGroupEvent.eventName

	constructor(public readonly newRank: MmrGroupFilterType) {}

	static readonly eventName = 'ChangeDeckRankGroupEvent'
}
