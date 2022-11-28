import { BgsActiveTimeFilterType } from '../../../../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsTimeFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly timeFilter: BgsActiveTimeFilterType) {}

	public static eventName(): string {
		return 'BgsTimeFilterSelectedEvent';
	}

	public eventName(): string {
		return 'BgsTimeFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
