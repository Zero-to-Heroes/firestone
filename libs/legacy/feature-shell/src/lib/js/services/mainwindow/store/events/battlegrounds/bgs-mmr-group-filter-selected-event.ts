import { MmrGroupFilterType } from '../../../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsMmrGroupFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly mmrGroupFilter: MmrGroupFilterType) {}

	public static eventName(): string {
		return 'BgsMmrGroupFilterSelectedEvent';
	}

	public eventName(): string {
		return 'BgsMmrGroupFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
