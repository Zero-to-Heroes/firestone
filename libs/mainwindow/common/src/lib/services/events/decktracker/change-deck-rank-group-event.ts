import { MainWindowStoreEvent } from '../main-window-store-event';
import { MmrGroupFilterType } from '../../../model/battlegrounds/mmr-group-filter-type';

export class ChangeDeckRankGroupEvent implements MainWindowStoreEvent {
	constructor(public readonly newRank: MmrGroupFilterType) {}

	public static eventName(): string {
		return 'ChangeDeckRankGroupEvent';
	}

	public eventName(): string {
		return 'ChangeDeckRankGroupEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
