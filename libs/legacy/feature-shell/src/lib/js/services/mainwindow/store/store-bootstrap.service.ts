import { Injectable } from '@angular/core';
import { ArenaState } from '@firestone/arena/common';
import {
	AchievementsState,
	DecktrackerState,
	MainWindowState,
	StatsState,
} from '@firestone/mainwindow/common';
import { Preferences } from '@firestone/shared/common/service';
import { LocalizationFacadeService } from '@services/localization-facade.service';

@Injectable()
export class StoreBootstrapService {
	constructor(private readonly i18n: LocalizationFacadeService) {}

	public buildInitialStore(prefs: Preferences): MainWindowState {
		return MainWindowState.create({
			showFtue: !prefs.ftue.hasSeenGlobalFtue,
			achievements: AchievementsState.create({
				filters: AchievementsState.buildFilterOptions(this.i18n),
			}),
			arena: ArenaState.create({
				categories: [
					{ id: 'arena-runs', name: this.i18n.translateString('app.arena.menu.my-runs') },
					{ id: 'class-tier-list', name: this.i18n.translateString('app.arena.menu.class-tier-list') },
					{ id: 'card-stats', name: this.i18n.translateString('app.arena.menu.card-stats') },
					{ id: 'arena-high-wins-runs', name: this.i18n.translateString('app.arena.menu.arena-top-runs') },
				],
			}),
			decktracker: DecktrackerState.create({
				isLoading: false,
				initComplete: true,
			}),
			stats: StatsState.create({
				categories: [
					{ id: 'match-stats', name: this.i18n.translateString('app.profile.match-stats-title') },
					// { id: 'xp-graph', name: this.i18n.translateString('app.stats.xp-graph-title') },
				],
				loading: false,
				filters: { xpGraphSeasonFilter: prefs.statsXpGraphSeasonFilter },
				initComplete: true,
			}),
			initComplete: true,
		} as MainWindowState);
	}
}
