import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { BgsPostMatchStats } from '@firestone/battlegrounds/common';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsGameEndEvent extends BattlegroundsStoreEvent {
	constructor(
		public readonly postMatchStats: BgsPostMatchStats,
		public readonly newBestStats: readonly BgsBestStat[],
		public readonly reviewId: string,
	) {
		super('BgsGameEndEvent');
	}
}
