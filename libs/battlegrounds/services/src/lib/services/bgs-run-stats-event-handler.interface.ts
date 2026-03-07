import { InjectionToken } from '@angular/core';
import { BgsPostMatchStats as IBgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { BgsPostMatchStats, BgsPostMatchStatsForReview } from '@firestone/game-state';

export const BGS_RUN_STATS_EVENT_HANDLER = new InjectionToken<IBgsRunStatsEventHandler>(
	'BgsRunStatsEventHandler',
);

export interface IBgsRunStatsEventHandler {
	onShowMatchStats(reviewId: string, stats: IBgsPostMatchStats): void;
	onHeroDetails(stats: readonly BgsPostMatchStatsForReview[], heroCardId: string): void;
	onPostMatchStatsComputed(
		reviewId: string,
		stats: BgsPostMatchStats,
		bestValues: readonly BgsBestStat[],
	): void;
}
