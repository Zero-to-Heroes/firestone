import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { BgsPostMatchStats } from '../../../../models/battlegrounds/post-match/bgs-post-match-stats';
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
