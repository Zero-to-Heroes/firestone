import { GlobalStats } from '../../../../../../models/mainwindow/stats/global/global-stats';
import { MainWindowStoreEvent } from '../../main-window-store-event';

export class GlobalStatsUpdatedEvent implements MainWindowStoreEvent {
	constructor(readonly stats: GlobalStats) {}

	public static eventName(): string {
		return 'GlobalStatsUpdatedEvent';
	}

	public eventName(): string {
		return 'GlobalStatsUpdatedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
