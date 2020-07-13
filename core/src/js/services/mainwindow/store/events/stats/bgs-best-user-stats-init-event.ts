import { BgsBestStat } from '../../../../../models/battlegrounds/post-match/bgs-best-stat';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsBestUserStatsInitEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'BgsBestUserStatsInitEvent';
	}

	constructor(public readonly bgsStats: readonly BgsBestStat[]) {}

	public eventName(): string {
		return 'BgsBestUserStatsInitEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return true;
	}
}
