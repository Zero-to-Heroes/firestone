import { Injectable } from '@angular/core';
import { BgsPostMatchStats as IBgsPostMatchStats } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsBestStat } from '@firestone-hs/user-bgs-post-match-stats';
import { IBgsRunStatsEventHandler } from '@firestone/battlegrounds/services';
import { BgsPostMatchStats, BgsPostMatchStatsForReview } from '@firestone/game-state';
import { BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent } from './events/battlegrounds/bgs-personal-stats-select-hero-details-with-remote-info-event';
import { BgsPostMatchStatsComputedEvent } from './events/battlegrounds/bgs-post-match-stats-computed-event';
import { ShowMatchStatsEvent } from './events/replays/show-match-stats-event';
import { MainWindowStateFacadeService } from './main-window-state-facade.service';

@Injectable()
export class BgsRunStatsEventHandlerService implements IBgsRunStatsEventHandler {
	constructor(private readonly mainWindowStateFacade: MainWindowStateFacadeService) {}

	onShowMatchStats(reviewId: string, stats: IBgsPostMatchStats): void {
		this.mainWindowStateFacade.send(new ShowMatchStatsEvent(reviewId, stats));
	}

	onHeroDetails(stats: readonly BgsPostMatchStatsForReview[], heroCardId: string): void {
		this.mainWindowStateFacade.send(
			new BgsPersonalStatsSelectHeroDetailsWithRemoteInfoEvent(stats, heroCardId),
		);
	}

	onPostMatchStatsComputed(
		reviewId: string,
		stats: BgsPostMatchStats,
		bestValues: readonly BgsBestStat[],
	): void {
		this.mainWindowStateFacade.send(new BgsPostMatchStatsComputedEvent(reviewId, stats, bestValues));
	}
}
