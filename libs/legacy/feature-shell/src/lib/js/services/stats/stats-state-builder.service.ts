/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { StatsCategory } from '../../models/mainwindow/stats/stats-category';
import { StatsState } from '../../models/mainwindow/stats/stats-state';
import { Preferences } from '../../models/preferences';

@Injectable()
export class StatsStateBuilderService {
	constructor(private readonly i18n: LocalizationFacadeService) {}

	public initState(
		prefs: Preferences,
		matchStats: GameStats,
		// archetypesConfig: readonly ArchetypeConfig[],
		// archetypesStats: ArchetypeStats,
	) {
		return StatsState.create({
			categories: [
				StatsCategory.create({
					id: 'xp-graph',
					name: this.i18n.translateString('app.stats.xp-graph-title'),
					enabled: true,
					icon: undefined,
					categories: null,
				} as StatsCategory),
			] as readonly StatsCategory[],
			loading: false,
			gameStats: matchStats,
			// archetypesConfig: archetypesConfig,
			// archetypesStats: archetypesStats,
			filters: {
				xpGraphSeasonFilter: prefs.statsXpGraphSeasonFilter,
			},
		} as StatsState);
	}
}
