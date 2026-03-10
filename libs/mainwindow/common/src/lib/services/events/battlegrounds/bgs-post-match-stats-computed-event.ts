import { BgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsPostMatchStatsComputedEvent implements MainWindowStoreEvent {
	
	readonly eventName = BgsPostMatchStatsComputedEvent.eventName

	constructor(
		public readonly reviewId: string,
		public readonly postMatchStats: BgsPostMatchStats,
		public readonly newBestStats: readonly BgsBestStat[],
	) {}

	static readonly eventName = 'BgsPostMatchStatsComputedEvent'
}
