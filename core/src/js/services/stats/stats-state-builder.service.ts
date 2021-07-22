/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { ArchetypeConfig } from '@firestone-hs/categorize-deck/dist/archetype-service';
import { BgsBestStat } from '@firestone-hs/compute-bgs-run-stats/dist/model/bgs-best-stat';
import { ArchetypeStats } from '@firestone-hs/cron-build-ranked-archetypes/dist/archetype-stats';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { StatsCategory } from '../../models/mainwindow/stats/stats-category';
import { StatsState } from '../../models/mainwindow/stats/stats-state';
import { Preferences } from '../../models/preferences';

@Injectable()
export class StatsStateBuilderService {
	public initState(
		prefs: Preferences,
		matchStats: GameStats,
		archetypesConfig: readonly ArchetypeConfig[],
		archetypesStats: ArchetypeStats,
		bgsBestUserStats: readonly BgsBestStat[],
	) {
		return StatsState.create({
			categories: [
				StatsCategory.create({
					id: 'xp-graph',
					name: 'XP Graph',
					enabled: true,
					icon: undefined,
					categories: null,
				} as StatsCategory),
			] as readonly StatsCategory[],
			loading: false,
			gameStats: matchStats,
			archetypesConfig: archetypesConfig,
			archetypesStats: archetypesStats,
			bestBgsUserStats: bgsBestUserStats,
			filters: {
				xpGraphSeasonFilter: prefs.statsXpGraphSeasonFilter,
			},
		} as StatsState);
	}
}
