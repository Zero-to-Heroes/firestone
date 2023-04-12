import { Injectable } from '@angular/core';
import { BgsHeroStatsV2 } from '@firestone-hs/bgs-global-stats';
import { ALL_BG_RACES } from '@firestone-hs/reference-data';
import {
	BgsMetaHeroStatsAccessService,
	BgsMetaHeroStatTierItem,
	buildHeroStats,
} from '@firestone/battlegrounds/data-access';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { WebsitePreferences, WebsitePreferencesService } from '@firestone/website/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { switchMap, withLatestFrom } from 'rxjs';
import * as MetaHeroStatsActions from './meta-hero-stats.actions';
import { MetaHeroStatsState } from './meta-hero-stats.models';
import { getCurrentPercentileFilter, getCurrentTimerFilter, getCurrentTribesFilter } from './meta-hero-stats.selectors';

@Injectable()
export class MetaHeroStatsEffects {
	// private actions$ = inject(Actions);

	constructor(
		private readonly actions$: Actions,
		private readonly store: Store<MetaHeroStatsState>,
		private readonly access: BgsMetaHeroStatsAccessService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: WebsitePreferencesService,
	) {}

	init$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(MetaHeroStatsActions.initBgsMetaHeroStats),
			withLatestFrom(
				this.store.select(getCurrentPercentileFilter),
				this.store.select(getCurrentTimerFilter),
				this.store.select(getCurrentTribesFilter),
			),
			switchMap(async ([action, percentileFilter, timeFilter, tribesFilter]) => {
				console.debug('initBgsMetaHeroStats', action, percentileFilter, timeFilter, tribesFilter);
				const mmrPercentile = percentileFilter;
				const tribes = tribesFilter;
				const timePeriod = timeFilter;
				const apiResult: BgsHeroStatsV2 = await this.access.loadMetaHeroStats(timePeriod);
				const result: readonly BgsMetaHeroStatTierItem[] = buildHeroStats(
					apiResult?.heroStats ?? [],
					mmrPercentile,
					tribes,
					true,
					this.allCards,
				);
				console.debug('result', result);
				return MetaHeroStatsActions.loadBgsMetaHeroStatsSuccess({
					stats: result,
					lastUpdateDate: apiResult.lastUpdateDate,
					mmrPercentiles: apiResult.mmrPercentiles,
					allTribes: ALL_BG_RACES,
				});
			}),
		);
	});

	changeTimeFilter$ = createEffect(() =>
		this.actions$.pipe(
			// Effects seem to always be called after reducers, so the data in the state should have the proper value here
			ofType(MetaHeroStatsActions.changeMetaHeroStatsTimeFilter),
			switchMap(async (action) => {
				const existingPrefs = await this.prefs.getPreferences();
				const newPrefs: WebsitePreferences = {
					...existingPrefs,
					bgsActiveTimeFilter: action.currentTimePeriodSelection,
				};
				await this.prefs.savePreferences(newPrefs);
				return MetaHeroStatsActions.initBgsMetaHeroStats();
			}),
		),
	);

	changePercentileFilter$ = createEffect(() =>
		this.actions$.pipe(
			// Effects seem to always be called after reducers, so the data in the state should have the proper value here
			ofType(MetaHeroStatsActions.changeMetaHeroStatsPercentileFilter),
			switchMap(async (action) => {
				const existingPrefs = await this.prefs.getPreferences();
				const newPrefs: WebsitePreferences = {
					...existingPrefs,
					bgsActiveRankFilter: action.currentPercentileSelection,
				};
				console.debug('changing percentile filter', action);
				await this.prefs.savePreferences(newPrefs);
				return MetaHeroStatsActions.initBgsMetaHeroStats();
			}),
		),
	);

	changeTribesFilter$ = createEffect(() =>
		this.actions$.pipe(
			// Effects seem to always be called after reducers, so the data in the state should have the proper value here
			ofType(MetaHeroStatsActions.changeMetaHeroStatsTribesFilter),
			switchMap(async (action) => {
				const existingPrefs = await this.prefs.getPreferences();
				const newPrefs: WebsitePreferences = {
					...existingPrefs,
					bgsActiveTribesFilter: action.currentTribesSelection,
				};
				await this.prefs.savePreferences(newPrefs);
				return MetaHeroStatsActions.initBgsMetaHeroStats();
			}),
		),
	);
}
