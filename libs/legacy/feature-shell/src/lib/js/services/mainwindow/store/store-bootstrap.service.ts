import { Injectable } from '@angular/core';
import { Preferences } from '@firestone/shared/common/service';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { ArenaState } from '../../../models/arena/arena-state';
import { DuelsState } from '../../../models/duels/duels-state';
import { AchievementsState } from '../../../models/mainwindow/achievements-state';
import { DeckFilters } from '../../../models/mainwindow/decktracker/deck-filters';
import { DecktrackerState } from '../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';

@Injectable()
export class StoreBootstrapService {
	constructor(private readonly i18n: LocalizationFacadeService) {}

	public buildInitialStore(prefs: Preferences): MainWindowState {
		const existingDecktrackerFilters = prefs?.desktopDeckFilters ?? new DeckFilters();
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
				loading: false,
			}),
			decktracker: DecktrackerState.create({
				filters: {
					gameFormat: existingDecktrackerFilters.gameFormat ?? 'all',
					gameMode: existingDecktrackerFilters.gameMode ?? 'ranked',
					time: existingDecktrackerFilters.time ?? 'all-time',
					sort: existingDecktrackerFilters.sort ?? 'last-played',
					rank: existingDecktrackerFilters.rank ?? 'all',
					rankingGroup: existingDecktrackerFilters.rankingGroup ?? 'per-match',
					rankingCategory: existingDecktrackerFilters.rankingCategory ?? 'leagues',
				},
				isLoading: false,
				initComplete: true,
			}),
			duels: DuelsState.create({
				categories: [
					{ id: 'duels-runs', name: this.i18n.translateString('app.duels.menu.my-runs') },
					{ id: 'duels-personal-decks', name: this.i18n.translateString('app.duels.menu.my-decks') },
					{ id: 'duels-stats', name: this.i18n.translateString('app.duels.menu.heroes') },
					{ id: 'duels-treasures', name: this.i18n.translateString('app.duels.menu.treasures') },
					{ id: 'duels-top-decks', name: this.i18n.translateString('app.duels.menu.high-win-decks') },
					{ id: 'duels-deck-details', name: null },
					{ id: 'duels-personal-deck-details', name: null },
					{ id: 'duels-leaderboard', name: this.i18n.translateString('app.duels.menu.leaderboard') },
					{ id: 'duels-deckbuilder', name: this.i18n.translateString('app.duels.menu.deckbuilder') },
					{ id: 'duels-buckets', name: this.i18n.translateString('app.duels.menu.buckets') },
				],
				loading: false,
				initComplete: true,
			}),
			stats: StatsState.create({
				categories: [
					{ id: 'match-stats', name: this.i18n.translateString('app.profile.match-stats-title') },
					{ id: 'xp-graph', name: this.i18n.translateString('app.stats.xp-graph-title') },
				],
				loading: false,
				filters: { xpGraphSeasonFilter: prefs.statsXpGraphSeasonFilter },
				initComplete: true,
			}),
			initComplete: true,
		} as MainWindowState);
	}
}
