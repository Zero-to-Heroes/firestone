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
import { WebsitePreferences, WebsitePreferencesService } from '@firestone/website/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { switchMap, withLatestFrom } from 'rxjs';

import * as WebsiteDuelsActions from './duels.actions';
import { WebsiteDuelsState } from './duels.models';
import { getCurrentPercentileFilter } from './duels.selectors';

@Injectable()
export class WebsiteDuelsEffects {
	constructor(
		private readonly actions$: Actions,
		// private readonly store: Store<MetaHeroStatsState>,
		private readonly access: DuelsMetaHeroStatsAccessService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: WebsitePreferencesService,
		private readonly store: Store<WebsiteDuelsState>,
	) {}

	init$ = createEffect(() =>
		this.actions$.pipe(
			ofType(WebsiteDuelsActions.initDuelsMetaHeroStats),
			withLatestFrom(this.store.select(getCurrentPercentileFilter)),
			switchMap(async ([action, percentileFiler]) => {
				const mmr = percentileFiler;
				const timeFilter = 'last-patch';
				const heroFilter = duelsHeroConfigs.map((conf) => conf.hero);
				const heroPowerFilter = 'all';
				const sigTreasureFilter = 'all';
				const statType: DuelsStatTypeFilterType = 'hero';
				const hideLowData = true;
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
				const transformed: readonly DuelsMetaStats[] = result
					.map((r) => {
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
					})
					.filter((r) => (hideLowData ? r.globalRunsPlayed > 10 : true));
				return WebsiteDuelsActions.loadDuelsMetaHeroStatsSuccess({
					stats: transformed,
					lastUpdateDate: apiResult?.lastUpdateDate ? new Date(apiResult?.lastUpdateDate) : undefined,
					mmrPercentiles: apiResult?.mmrPercentiles ?? [],
				});
			}),
		),
	);

	changePercentileFilter$ = createEffect(() =>
		this.actions$.pipe(
			// Effects seem to always be called after reducers, so the data in the state should have the proper value here
			ofType(WebsiteDuelsActions.changeMetaHeroStatsPercentileFilter),
			switchMap(async (action) => {
				const existingPrefs = await this.prefs.getPreferences();
				const newPrefs: WebsitePreferences = {
					...existingPrefs,
					duelsActiveMmrFilter: action.currentPercentileSelection,
				};
				await this.prefs.savePreferences(newPrefs);
				return WebsiteDuelsActions.initDuelsMetaHeroStats();
			}),
		),
	);
}
