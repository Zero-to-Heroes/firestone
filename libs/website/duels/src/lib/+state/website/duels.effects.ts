import { Injectable } from '@angular/core';
import { DuelsStat, DuelsTreasureStat, MmrPercentile } from '@firestone-hs/duels-global-stats/dist/stat';
import { duelsHeroConfigs } from '@firestone-hs/reference-data';
import {
	buildDuelsCombinedHeroStats,
	DuelsCombinedHeroStat,
	DuelsMetaHeroStatsAccessService,
	DuelsStatTypeFilterType,
	DuelsTimeFilterType,
	DuelsTreasureStatTypeFilterType,
	filterDuelsHeroStats,
	filterDuelsTreasureStats,
	getGroupingKeyForHeroStat,
} from '@firestone/duels/data-access';
import { DuelsMetaStats } from '@firestone/duels/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { WebsitePreferences, WebsitePreferencesService } from '@firestone/website/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { combineLatest, filter, merge, switchMap, withLatestFrom } from 'rxjs';

import * as WebsiteDuelsActions from './duels.actions';
import { WebsiteDuelsState } from './duels.models';
import {
	getActiveTreasureSelection,
	getCurrentPercentileFilter,
	getCurrentTimerFilter,
	getPassiveTreasureSelection,
} from './duels.selectors';

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

	metaHeroes$ = createEffect(() =>
		this.actions$.pipe(
			ofType(WebsiteDuelsActions.initDuelsMetaHeroStats),
			withLatestFrom(this.store.select(getCurrentPercentileFilter), this.store.select(getCurrentTimerFilter)),
			switchMap(async ([action, percentileFiler, timeFilter]) => {
				const stats = await this.buildHeroStats(percentileFiler, timeFilter, 'hero');
				return WebsiteDuelsActions.loadDuelsMetaHeroStatsSuccess({
					stats: stats.stats,
					lastUpdateDate: stats?.lastUpdateDate,
					mmrPercentiles: stats?.mmrPercentiles ?? [],
				});
			}),
		),
	);

	metaHeroPowers$ = createEffect(() =>
		this.actions$.pipe(
			ofType(WebsiteDuelsActions.initDuelsMetaHeroPowerStats),
			withLatestFrom(this.store.select(getCurrentPercentileFilter), this.store.select(getCurrentTimerFilter)),
			switchMap(async ([action, percentileFiler, timeFilter]) => {
				const stats = await this.buildHeroStats(percentileFiler, timeFilter, 'hero-power');
				return WebsiteDuelsActions.loadDuelsMetaHeroPowerStatsSuccess({
					stats: stats.stats,
					lastUpdateDate: stats?.lastUpdateDate,
					mmrPercentiles: stats?.mmrPercentiles ?? [],
				});
			}),
		),
	);

	metaSignatures$ = createEffect(() =>
		this.actions$.pipe(
			ofType(WebsiteDuelsActions.initDuelsMetaSignatureTreasureStats),
			withLatestFrom(this.store.select(getCurrentPercentileFilter), this.store.select(getCurrentTimerFilter)),
			switchMap(async ([action, percentileFiler, timeFilter]) => {
				const stats = await this.buildHeroStats(percentileFiler, timeFilter, 'signature-treasure');
				return WebsiteDuelsActions.loadDuelsMetaSignatureTreasureStatsSuccess({
					stats: stats.stats,
					lastUpdateDate: stats?.lastUpdateDate,
					mmrPercentiles: stats?.mmrPercentiles ?? [],
				});
			}),
		),
	);

	// TODO: only trigger the effect if we are on the relevant page?
	metaActives$ = createEffect(() => {
		// Combine the latest values from the observables into a single array
		const params$ = combineLatest([
			this.store.select(getCurrentPercentileFilter),
			this.store.select(getCurrentTimerFilter),
			this.store.select(getActiveTreasureSelection),
		]);

		// Listen to initDuelsMetaPassiveTreasureStats action and combined observables
		const merged$ = merge(
			this.actions$.pipe(ofType(WebsiteDuelsActions.initDuelsMetaActiveTreasureStats)),
			params$,
		);

		return merged$.pipe(
			withLatestFrom(params$),
			// Only trigger the effect if action data or any of the combined observables data has changed
			filter(([action, params]) => !!action || !!params),
			switchMap(async ([action, [percentileFiler, timeFilter, statType]]) => {
				const stats = await this.buildTreasureStats(percentileFiler, timeFilter, statType);
				console.debug('built actives', stats, percentileFiler, timeFilter, statType);
				return WebsiteDuelsActions.loadDuelsMetaActiveTreasureStatsSuccess({
					stats: stats.stats,
					lastUpdateDate: stats?.lastUpdateDate,
					mmrPercentiles: stats?.mmrPercentiles ?? [],
				});
			}),
		);
	});

	metaPassives$ = createEffect(() => {
		// Combine the latest values from the observables into a single array
		const params$ = combineLatest([
			this.store.select(getCurrentPercentileFilter),
			this.store.select(getCurrentTimerFilter),
			this.store.select(getPassiveTreasureSelection),
		]);

		// Listen to initDuelsMetaPassiveTreasureStats action and combined observables
		const merged$ = merge(
			this.actions$.pipe(ofType(WebsiteDuelsActions.initDuelsMetaPassiveTreasureStats)),
			params$,
		);

		return merged$.pipe(
			withLatestFrom(params$),
			// Only trigger the effect if action data or any of the combined observables data has changed
			filter(([action, params]) => !!action || !!params),
			switchMap(async ([action, [percentileFiler, timeFilter, statType]]) => {
				const stats = await this.buildTreasureStats(percentileFiler, timeFilter, statType);
				console.debug('built passives', stats, percentileFiler, timeFilter, statType);
				return WebsiteDuelsActions.loadDuelsMetaPassiveTreasureStatsSuccess({
					stats: stats.stats,
					lastUpdateDate: stats?.lastUpdateDate,
					mmrPercentiles: stats?.mmrPercentiles ?? [],
				});
			}),
		);
	});

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

	changeTimeFilter$ = createEffect(() =>
		this.actions$.pipe(
			// Effects seem to always be called after reducers, so the data in the state should have the proper value here
			ofType(WebsiteDuelsActions.changeMetaHeroStatsTimeFilter),
			switchMap(async (action) => {
				const existingPrefs = await this.prefs.getPreferences();
				const newPrefs: WebsitePreferences = {
					...existingPrefs,
					duelsActiveTimeFilter: action.currentTimePeriodSelection,
				};
				await this.prefs.savePreferences(newPrefs);
				return WebsiteDuelsActions.initDuelsMetaHeroStats();
			}),
		),
	);

	private async buildHeroStats(
		percentileFilter,
		timeFilter: DuelsTimeFilterType,
		statType: DuelsStatTypeFilterType,
	): Promise<{
		stats: readonly DuelsMetaStats[];
		lastUpdateDate?: Date;
		mmrPercentiles?: readonly MmrPercentile[];
	}> {
		if (!this.allCards?.getCards()?.length) {
			return {
				stats: [],
			};
		}
		const heroFilter = duelsHeroConfigs.map((conf) => conf.hero);
		const heroPowerFilter = 'all';
		const sigTreasureFilter = 'all';
		const hideLowData = true;
		const heroSearchString = null;
		console.debug('loading duels stats', percentileFilter, timeFilter);
		// TODO: cache this somehow?
		const apiResult: DuelsStat | null = await this.access.loadMetaHeroes(percentileFilter, timeFilter);
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
		const result: readonly DuelsCombinedHeroStat[] = buildDuelsCombinedHeroStats(
			filteredStats,
			getGroupingKeyForHeroStat(statType),
		);
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
		return {
			stats: transformed,
			lastUpdateDate: apiResult?.lastUpdateDate ? new Date(apiResult?.lastUpdateDate) : undefined,
			mmrPercentiles: apiResult?.mmrPercentiles ?? [],
		};
	}

	private async buildTreasureStats(
		percentileFilter,
		timeFilter: DuelsTimeFilterType,
		statType: DuelsTreasureStatTypeFilterType,
	): Promise<{
		stats: readonly DuelsMetaStats[];
		lastUpdateDate?: Date;
		mmrPercentiles?: readonly MmrPercentile[];
	}> {
		if (!this.allCards?.getCards()?.length) {
			return {
				stats: [],
			};
		}
		const heroFilter = duelsHeroConfigs.map((conf) => conf.hero);
		const heroPowerFilter = 'all';
		const sigTreasureFilter = 'all';
		const hideLowData = true;
		const heroSearchString = null;
		console.debug('loading duels stats', percentileFilter, timeFilter);
		// TODO: cache this somehow?
		const apiResult: DuelsStat | null = await this.access.loadMetaHeroes(percentileFilter, timeFilter);
		const filteredStats = filterDuelsTreasureStats(
			apiResult?.treasures ?? [],
			heroFilter,
			heroPowerFilter,
			sigTreasureFilter,
			statType,
			this.allCards,
			heroSearchString,
		);
		console.debug('duels filtered stats', filteredStats, apiResult);
		const result: readonly DuelsCombinedHeroStat[] = buildDuelsCombinedHeroStats(
			filteredStats,
			(stat: DuelsTreasureStat) => stat.treasureCardId,
		);
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
		return {
			stats: transformed,
			lastUpdateDate: apiResult?.lastUpdateDate ? new Date(apiResult?.lastUpdateDate) : undefined,
			mmrPercentiles: apiResult?.mmrPercentiles ?? [],
		};
	}
}
