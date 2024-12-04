import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { BgsPostMatchStats } from '@firestone/battlegrounds/core';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsGameEndEvent extends BattlegroundsStoreEvent {
	public static readonly eventName = 'BgsGameEndEvent' as const;
	constructor(
		public readonly postMatchStats: BgsPostMatchStats,
		public readonly newBestStats: readonly BgsBestStat[],
		public readonly reviewId: string,
	) {
		super('BgsGameEndEvent');
	}
}
