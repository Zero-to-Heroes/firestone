import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { MainWindowStoreEvent } from '../../main-window-store-event';

export class GlobalStatsLoadedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'GlobalStatsLoadedEvent';
	}

	constructor(public readonly stats: GlobalStats) {}

	public eventName(): string {
		return 'GlobalStatsLoadedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
