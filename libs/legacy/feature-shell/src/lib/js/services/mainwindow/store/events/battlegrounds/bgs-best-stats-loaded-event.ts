import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsBestStatsLoadedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'BgsBestStatsLoadedEvent';
	}

	constructor(public readonly stats: readonly BgsBestStat[]) {}

	public eventName(): string {
		return 'BgsBestStatsLoadedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
