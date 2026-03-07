import { BgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsPostMatchStatsComputedEvent implements MainWindowStoreEvent {
	constructor(
		public readonly reviewId: string,
		public readonly postMatchStats: BgsPostMatchStats,
		public readonly newBestStats: readonly BgsBestStat[],
	) {}

	public static eventName(): string {
		return 'BgsPostMatchStatsComputedEvent';
	}

	public eventName(): string {
		return 'BgsPostMatchStatsComputedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
