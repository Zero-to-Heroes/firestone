import { Injectable } from '@angular/core';
import { DuelsStat, DuelsTreasureStat, MmrPercentile } from '@firestone-hs/duels-global-stats/dist/stat';
import {
	buildDuelsCombinedHeroStats,
	DuelsCombinedHeroStat,
	DuelsHeroFilterType,
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
import { combineLatest, filter, merge, switchMap, tap, withLatestFrom } from 'rxjs';

import * as WebsiteDuelsActions from './duels.actions';
import { WebsiteDuelsState } from './duels.models';
import {
	getActiveTreasureSelection,
	getCurrentHeroFilter,
	getCurrentHeroPowerFilter,
	getCurrentPercentileFilter,
	getCurrentSignatureFilter,
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

	metaHeroes$ = createEffect(() => {
		const params$ = combineLatest([
			this.store.select(getCurrentPercentileFilter),
			this.store.select(getCurrentTimerFilter),
			this.store.select(getCurrentHeroFilter),
		]);
		const merged$ = merge(this.actions$.pipe(ofType(WebsiteDuelsActions.initDuelsMetaHeroStats)), params$);
		return merged$.pipe(
			withLatestFrom(params$),
			filter(([action, params]) => !!action || !!params),
			switchMap(async ([action, [percentileFiler, timeFilter, heroFilter]]) => {
				const stats = await this.buildHeroStats(percentileFiler, timeFilter, 'hero', heroFilter, [], []);
				return WebsiteDuelsActions.loadDuelsMetaHeroStatsSuccess({
					stats: stats.stats,
					lastUpdateDate: stats?.lastUpdateDate,
					mmrPercentiles: stats?.mmrPercentiles ?? [],
				});
			}),
		);
	});

	metaHeroPowers$ = createEffect(() => {
		const params$ = combineLatest([
			this.store.select(getCurrentPercentileFilter),
			this.store.select(getCurrentTimerFilter),
			this.store.select(getCurrentHeroFilter),
			this.store.select(getCurrentSignatureFilter),
		]).pipe(tap((info) => console.debug('params$', info)));
		const merged$ = merge(
			this.actions$.pipe(ofType(WebsiteDuelsActions.initDuelsMetaHeroPowerStats)),
			params$,
		).pipe(tap((info) => console.debug('merged$', info)));
		return merged$.pipe(
			withLatestFrom(params$),
			// filter(([action, params]) => !!action || !!params),
			switchMap(async ([action, [percentileFiler, timeFilter, heroFilter, signatureTreasureFilter]]) => {
				console.debug('building HP stats', signatureTreasureFilter);
				const stats = await this.buildHeroStats(
					percentileFiler,
					timeFilter,
					'hero-power',
					heroFilter,
					[],
					signatureTreasureFilter,
				);
				return WebsiteDuelsActions.loadDuelsMetaHeroPowerStatsSuccess({
					stats: stats.stats,
					lastUpdateDate: stats?.lastUpdateDate,
					mmrPercentiles: stats?.mmrPercentiles ?? [],
				});
			}),
		);
	});

	metaSignatures$ = createEffect(() => {
		const params$ = combineLatest([
			this.store.select(getCurrentPercentileFilter),
			this.store.select(getCurrentTimerFilter),
			this.store.select(getCurrentHeroFilter),
			this.store.select(getCurrentHeroPowerFilter),
		]);
		const merged$ = merge(
			this.actions$.pipe(ofType(WebsiteDuelsActions.initDuelsMetaSignatureTreasureStats)),
			params$,
		);
		return merged$.pipe(
			withLatestFrom(params$),
			filter(([action, params]) => !!action || !!params),
			switchMap(async ([action, [percentileFiler, timeFilter, heroFilter, heroPowerFilter]]) => {
				const stats = await this.buildHeroStats(
					percentileFiler,
					timeFilter,
					'signature-treasure',
					heroFilter,
					heroPowerFilter,
					[],
				);
				return WebsiteDuelsActions.loadDuelsMetaSignatureTreasureStatsSuccess({
					stats: stats.stats,
					lastUpdateDate: stats?.lastUpdateDate,
					mmrPercentiles: stats?.mmrPercentiles ?? [],
				});
			}),
		);
	});

	// TODO: only trigger the effect if we are on the relevant page?
	metaActives$ = createEffect(() => {
		const params$ = combineLatest([
			this.store.select(getCurrentPercentileFilter),
			this.store.select(getCurrentTimerFilter),
			this.store.select(getActiveTreasureSelection),
			this.store.select(getCurrentHeroFilter),
			this.store.select(getCurrentHeroPowerFilter),
			this.store.select(getCurrentSignatureFilter),
		]);
		const merged$ = merge(
			this.actions$.pipe(ofType(WebsiteDuelsActions.initDuelsMetaActiveTreasureStats)),
			params$,
		);
		return merged$.pipe(
			withLatestFrom(params$),
			filter(([action, params]) => !!action || !!params),
			switchMap(
				async ([
					action,
					[percentileFiler, timeFilter, statType, heroFilter, heroPowerFilter, signatureFilter],
				]) => {
					const stats = await this.buildTreasureStats(
						percentileFiler,
						timeFilter,
						statType,
						heroFilter,
						heroPowerFilter,
						signatureFilter,
					);
					console.debug('built actives', stats, percentileFiler, timeFilter, statType);
					return WebsiteDuelsActions.loadDuelsMetaActiveTreasureStatsSuccess({
						stats: stats.stats,
						lastUpdateDate: stats?.lastUpdateDate,
						mmrPercentiles: stats?.mmrPercentiles ?? [],
					});
				},
			),
		);
	});

	metaPassives$ = createEffect(() => {
		const params$ = combineLatest([
			this.store.select(getCurrentPercentileFilter),
			this.store.select(getCurrentTimerFilter),
			this.store.select(getPassiveTreasureSelection),
			this.store.select(getCurrentHeroFilter),
			this.store.select(getCurrentHeroPowerFilter),
			this.store.select(getCurrentSignatureFilter),
		]);
		const merged$ = merge(
			this.actions$.pipe(ofType(WebsiteDuelsActions.initDuelsMetaPassiveTreasureStats)),
			params$,
		);
		return merged$.pipe(
			withLatestFrom(params$),
			filter(([action, params]) => !!action || !!params),
			switchMap(
				async ([
					action,
					[percentileFiler, timeFilter, statType, heroFilter, heroPowerFilter, signatureFilter],
				]) => {
					const stats = await this.buildTreasureStats(
						percentileFiler,
						timeFilter,
						statType,
						heroFilter,
						heroPowerFilter,
						signatureFilter,
					);
					console.debug('built passives', stats, percentileFiler, timeFilter, statType);
					return WebsiteDuelsActions.loadDuelsMetaPassiveTreasureStatsSuccess({
						stats: stats.stats,
						lastUpdateDate: stats?.lastUpdateDate,
						mmrPercentiles: stats?.mmrPercentiles ?? [],
					});
				},
			),
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
				return WebsiteDuelsActions.prefsUpdateSuccess();
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
				return WebsiteDuelsActions.prefsUpdateSuccess();
			}),
		),
	);

	changeHeroFilter$ = createEffect(() =>
		this.actions$.pipe(
			// Effects seem to always be called after reducers, so the data in the state should have the proper value here
			ofType(WebsiteDuelsActions.changeHeroFilter),
			switchMap(async (action) => {
				const existingPrefs = await this.prefs.getPreferences();
				const newPrefs: WebsitePreferences = {
					...existingPrefs,
					duelsActiveHeroesFilter2: action.currentHeroSelection,
				};
				await this.prefs.savePreferences(newPrefs);
				return WebsiteDuelsActions.prefsUpdateSuccess();
			}),
		),
	);

	changeHeroPowerFilter$ = createEffect(() =>
		this.actions$.pipe(
			// Effects seem to always be called after reducers, so the data in the state should have the proper value here
			ofType(WebsiteDuelsActions.changeHeroPowerFilter),
			switchMap(async (action) => {
				const existingPrefs = await this.prefs.getPreferences();
				const newPrefs: WebsitePreferences = {
					...existingPrefs,
					duelsActiveHeroPowerFilter2: action.currentHeroPowerSelection,
				};
				await this.prefs.savePreferences(newPrefs);
				return WebsiteDuelsActions.prefsUpdateSuccess();
			}),
		),
	);

	changeSignatureFilter$ = createEffect(() =>
		this.actions$.pipe(
			// Effects seem to always be called after reducers, so the data in the state should have the proper value here
			ofType(WebsiteDuelsActions.changeSignatureTreasureFilter),
			switchMap(async (action) => {
				const existingPrefs = await this.prefs.getPreferences();
				const newPrefs: WebsitePreferences = {
					...existingPrefs,
					duelsActiveSignatureTreasureFilter2: action.currentSignatureSelection,
				};
				await this.prefs.savePreferences(newPrefs);
				console.debug('updated signature filter', action.currentSignatureSelection);
				return WebsiteDuelsActions.prefsUpdateSuccess();
			}),
		),
	);

	private async buildHeroStats(
		percentileFilter,
		timeFilter: DuelsTimeFilterType,
		statType: DuelsStatTypeFilterType,
		heroFilter: DuelsHeroFilterType,
		heroPowerFilter: readonly string[],
		sigTreasureFilter: readonly string[],
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
		heroFilter: DuelsHeroFilterType,
		heroPowerFilter: readonly string[],
		sigTreasureFilter: readonly string[],
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
