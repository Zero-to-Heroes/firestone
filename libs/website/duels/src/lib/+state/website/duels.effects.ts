import { Injectable } from '@angular/core';
import { DuelsStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { duelsHeroConfigs } from '@firestone-hs/reference-data';
import {
	buildDuelsCombinedHeroStats,
	DuelsCombinedHeroStat,
	DuelsMetaHeroStatsAccessService,
	DuelsStatTypeFilterType,
	filterDuelsHeroStats,
} from '@firestone/duels/data-access';
import { DuelsMetaStats } from '@firestone/duels/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { WebsitePreferencesService } from '@firestone/website/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap } from 'rxjs';

import * as WebsiteDuelsActions from './duels.actions';

@Injectable()
export class WebsiteDuelsEffects {
	constructor(
		private readonly actions$: Actions,
		// private readonly store: Store<MetaHeroStatsState>,
		private readonly access: DuelsMetaHeroStatsAccessService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: WebsitePreferencesService,
	) {}

	init$ = createEffect(() =>
		this.actions$.pipe(
			ofType(WebsiteDuelsActions.initDuelsMetaHeroStats),
			switchMap(async (action) => {
				const mmr = 100;
				const timeFilter = 'last-patch';
				const heroFilter = duelsHeroConfigs.map((conf) => conf.hero);
				const heroPowerFilter = 'all';
				const sigTreasureFilter = 'all';
				const statType: DuelsStatTypeFilterType = 'hero';
				const heroSearchString = null;
				console.debug('loading duels stats', mmr, timeFilter);
				// TODO: cache this somehow?
				const apiResult: DuelsStat | null = await this.access.loadMetaHeroes(mmr, timeFilter);
				const filteredStats = filterDuelsHeroStats(
					apiResult?.heroes ?? [],
					heroFilter,
					heroPowerFilter,
					sigTreasureFilter,
					statType,
					this.allCards,
					heroSearchString,
				);
				console.debug('duels filtered stats', filteredStats, apiResult);
				const result: readonly DuelsCombinedHeroStat[] = buildDuelsCombinedHeroStats(filteredStats, statType);
				const transformed: readonly DuelsMetaStats[] = result.map((r) => {
					const card = this.allCards.getCard(r.cardId);
					const placementDistribution: readonly { wins: number; runs: number; percentage: number }[] =
						Object.keys(r.globalWinDistribution).map((wins) => {
							const placementData: {
								winNumber: number;
								value: number;
							} = r.globalWinDistribution[wins];
							return {
								wins: +wins,
								percentage: placementData.value,
								runs: 0,
							};
						});
					return {
						cardId: r.cardId,
						cardName: card.name,
						globalPopularity: r.globalPopularity,
						globalRunsPlayed: r.globalTotalMatches,
						globalWinrate: r.globalWinrate,
						placementDistribution: placementDistribution,
					};
				});
				return WebsiteDuelsActions.loadDuelsMetaHeroStatsSuccess({
					stats: transformed,
					lastUpdateDate: apiResult?.lastUpdateDate ? new Date(apiResult?.lastUpdateDate) : undefined,
					mmrPercentiles: apiResult?.mmrPercentiles ?? [],
				});
			}),
		),
	);
}
