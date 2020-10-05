import { BgsRankFilterType } from '../../../../../models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsRankFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly rankFilter: BgsRankFilterType) {}

	public static eventName(): string {
		return 'BgsRankFilterSelectedEvent';
	}

	public eventName(): string {
		return 'BgsRankFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
