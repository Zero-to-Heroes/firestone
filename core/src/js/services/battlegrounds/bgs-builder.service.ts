import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BgsHeroStat } from '../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { BattlegroundsAppState } from '../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { Preferences } from '../../models/preferences';
import { PreferencesService } from '../preferences.service';
import { BgsStatUpdateParser } from './store/event-parsers/bgs-stat-update-parser';

@Injectable()
export class BgsBuilderService {
	constructor(private readonly cards: AllCardsService, private readonly prefs: PreferencesService) {}

	public async updateStats(
		currentState: BattlegroundsAppState,
		matchStats: GameStats,
		currentBattlegroundsMetaPatch: number,
	): Promise<BattlegroundsAppState> {
		const bgsMatchStats: readonly GameStat[] = matchStats?.stats?.filter(stat => stat.gameMode === 'battlegrounds');
		const prefs = await this.prefs.getPreferences();
		const activeBgsMatchStats = this.filterBgsMatchStats(bgsMatchStats, prefs, currentBattlegroundsMetaPatch);
		const heroStatsWithPlayer: readonly BgsHeroStat[] = BgsStatUpdateParser.buildHeroStats(
			currentState.globalStats,
			activeBgsMatchStats,
			this.cards,
		);
		const statsWithPlayer = currentState.globalStats?.update({
			heroStats: heroStatsWithPlayer,
			currentBattlegroundsMetaPatch: currentBattlegroundsMetaPatch,
		} as BgsStats);
		const sortedStats: readonly BgsHeroStat[] = [...statsWithPlayer.heroStats].sort(
			this.buildSortingFunction(prefs),
		);
		const finalStats = statsWithPlayer.update({
			heroStats: sortedStats,
		} as BgsStats);
		return currentState.update({
			stats: finalStats,
			matchStats: activeBgsMatchStats,
			activeTimeFilter: prefs.bgsActiveTimeFilter,
			activeHeroSortFilter: prefs.bgsActiveHeroSortFilter,
		} as BattlegroundsAppState);
	}

	private filterBgsMatchStats(
		bgsMatchStats: readonly GameStat[],
		prefs: Preferences,
		currentBattlegroundsMetaPatch: number,
	): readonly GameStat[] {
		if (!prefs.bgsActiveTimeFilter || prefs.bgsActiveTimeFilter === 'last-patch') {
			return bgsMatchStats.filter(stat => stat.buildNumber >= currentBattlegroundsMetaPatch);
		}
		return bgsMatchStats;
	}

	private buildSortingFunction(prefs: Preferences): (a: BgsHeroStat, b: BgsHeroStat) => number {
		switch (prefs.bgsActiveHeroSortFilter) {
			case 'games-played':
				return (a, b) => b.playerGamesPlayed - a.playerGamesPlayed;
			default:
				return (a, b) => {
					if (!a.playerAveragePosition) {
						return 1;
					}
					if (!b.playerAveragePosition) {
						return -1;
					}
					return a.playerAveragePosition - b.playerAveragePosition;
				};
		}
	}
}
