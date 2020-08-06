import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { MainWindowStoreEvent } from '../../main-window-store-event';

export class GlobalStatsUpdatedEvent implements MainWindowStoreEvent {
	constructor(public readonly stats: GlobalStats) {}

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
