import { Injectable } from '@angular/core';
import {
	BgsMetaHeroStatsAccessService,
	BgsMetaHeroStatTierItem,
	buildHeroStats,
} from '@firestone/battlegrounds/data-access';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { WebsitePreferencesService } from 'libs/website/core/src/lib/preferences/website-preferences.service';

import { map, switchMap, tap } from 'rxjs';
import * as MetaHeroStatsActions from './meta-hero-stats.actions';

@Injectable()
export class MetaHeroStatsEffects {
	// private actions$ = inject(Actions);

	constructor(
		private readonly actions$: Actions,
		private readonly access: BgsMetaHeroStatsAccessService,
		private readonly allCards: CardsFacadeService,
		private readonly prefs: WebsitePreferencesService,
	) {}

	init$ = createEffect(() => {
		console.debug('create init effect');
		return this.actions$.pipe(
			tap((e) => console.debug('in tap', e)),
			ofType(MetaHeroStatsActions.initBgsMetaHeroStats),
			tap((e) => console.debug('in tap 2', e)),
			switchMap(async (action) => {
				console.debug('initBgsMetaHeroStats', action);
				const prefs = await this.prefs.getPreferences();
				const mmrPercentile = 100;
				const tribes = [];
				const timePeriod = 'last-patch';
				const apiResult = await this.access.loadMetaHeroStats(timePeriod);
				const result: readonly BgsMetaHeroStatTierItem[] = buildHeroStats(
					apiResult?.heroStats ?? [],
					mmrPercentile,
					tribes,
					true,
					this.allCards,
				);
				return MetaHeroStatsActions.loadBgsMetaHeroStatsSuccess({
					stats: result,
					lastUpdateDate: apiResult.lastUpdateDate,
					mmrPercentiles: apiResult.mmrPercentiles,
				});
			}),
		);
	});

	changeTimeFilter$ = createEffect(() =>
		this.actions$.pipe(
			// Effects seem to always be called after reducers, so the data in the state should have the proper value here
			ofType(MetaHeroStatsActions.changeMetaHeroStatsTimeFilter),
			map((action) => MetaHeroStatsActions.initBgsMetaHeroStats()),
		),
	);

	changePercentileFilter$ = createEffect(() =>
		this.actions$.pipe(
			// Effects seem to always be called after reducers, so the data in the state should have the proper value here
			ofType(MetaHeroStatsActions.changeMetaHeroStatsPercentileFilter),
			map((action) => MetaHeroStatsActions.initBgsMetaHeroStats()),
		),
	);

	changeTribesFilter$ = createEffect(() =>
		this.actions$.pipe(
			// Effects seem to always be called after reducers, so the data in the state should have the proper value here
			ofType(MetaHeroStatsActions.changeMetaHeroStatsTribesFilter),
			map((action) => MetaHeroStatsActions.initBgsMetaHeroStats()),
		),
	);
}
