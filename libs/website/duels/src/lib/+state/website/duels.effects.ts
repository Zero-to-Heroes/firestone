import { Injectable } from '@angular/core';
import { DuelsStat } from '@firestone-hs/duels-global-stats/dist/stat';
import {
	buildDuelsCombinedHeroStats,
	DuelsCombinedHeroStat,
	DuelsMetaHeroStatsAccessService,
	DuelsStatTypeFilterType,
	filterDuelsHeroStats,
} from '@firestone/duels/data-access';
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
				const heroFilter = [];
				const heroPowerFilter = 'all';
				const sigTreasureFilter = 'all';
				const statType: DuelsStatTypeFilterType = 'hero';
				const heroSearchString = null;
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
				console.debug('filtered stats', filteredStats, apiResult);
				const result: readonly DuelsCombinedHeroStat[] = buildDuelsCombinedHeroStats(filteredStats, statType);
				return WebsiteDuelsActions.loadDuelsMetaHeroStatsSuccess({
					stats: result,
					lastUpdateDate: apiResult?.lastUpdateDate ? new Date(apiResult?.lastUpdateDate) : undefined,
					mmrPercentiles: apiResult?.mmrPercentiles ?? [],
				});
			}),
		),
	);
}
