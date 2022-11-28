import { MmrGroupFilterType } from '../../../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { MainWindowStoreEvent } from '../main-window-store-event';

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
