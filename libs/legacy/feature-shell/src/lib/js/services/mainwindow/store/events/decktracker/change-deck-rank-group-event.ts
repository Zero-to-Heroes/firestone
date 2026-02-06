import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { MmrGroupFilterType } from '@firestone/mainwindow/common';

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
