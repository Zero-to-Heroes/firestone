import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BgsHeroStat } from '../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { BattlegroundsAppState } from '../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { PatchInfo } from '../../models/patches';
import { Preferences } from '../../models/preferences';
import { PreferencesService } from '../preferences.service';
import { BgsStatUpdateParser } from './store/event-parsers/bgs-stat-update-parser';

@Injectable()
export class BgsBuilderService {
	constructor(private readonly cards: AllCardsService, private readonly prefs: PreferencesService) {}

	public async updateStats(
		currentState: BattlegroundsAppState,
		matchStats: GameStats,
		currentBattlegroundsMetaPatch: PatchInfo,
	): Promise<BattlegroundsAppState> {
		const bgsMatchStats: readonly GameStat[] = matchStats?.stats?.filter(
			(stat) => stat.gameMode === 'battlegrounds',
		);
		const prefs = await this.prefs.getPreferences();
		const activeBgsMatchStats = this.filterBgsMatchStats(
			bgsMatchStats,
			prefs,
			currentBattlegroundsMetaPatch?.number,
		);
		const heroStatsWithPlayer: readonly BgsHeroStat[] = BgsStatUpdateParser.buildHeroStats(
			currentState.globalStats,
			activeBgsMatchStats,
			this.cards,
		);
		if (!currentState.globalStats) {
			console.warn('Did not retrieve global stats');
			return currentState;
		}
		const statsWithPlayer = currentState.globalStats?.update({
			heroStats: heroStatsWithPlayer,
			currentBattlegroundsMetaPatch: currentBattlegroundsMetaPatch,
		} as BgsStats);
		const sortedStats: readonly BgsHeroStat[] = [...(statsWithPlayer?.heroStats || [])].sort(
			this.buildSortingFunction(prefs),
		);
		const finalStats = statsWithPlayer?.update({
			heroStats: sortedStats,
		} as BgsStats);
		return currentState.update({
			stats: finalStats,
			matchStats: activeBgsMatchStats,
			activeTimeFilter: prefs.bgsActiveTimeFilter,
			activeHeroSortFilter: prefs.bgsActiveHeroSortFilter,
			activeHeroFilter: prefs.bgsActiveHeroFilter,
			activeRankFilter: prefs.bgsActiveRankFilter,
			activeGroupMmrFilter: prefs.bgsActiveMmrGroupFilter,
		} as BattlegroundsAppState);
	}

	public filterBgsMatchStats(
		bgsMatchStats: readonly GameStat[],
		prefs: Preferences,
		currentBattlegroundsMetaPatch: number,
	): readonly GameStat[] {
		return bgsMatchStats
			.filter((stat) => this.timeFilter(stat, prefs, currentBattlegroundsMetaPatch))
			.filter((stat) => this.rankFilter(stat, prefs));
	}

	private timeFilter(stat: GameStat, prefs: Preferences, currentBattlegroundsMetaPatch: number) {
		if (!prefs.bgsActiveTimeFilter) {
			return true;
		}

		switch (prefs.bgsActiveTimeFilter) {
			case 'last-patch':
				return stat.buildNumber >= currentBattlegroundsMetaPatch;
			case 'past-30':
				return Date.now() - stat.creationTimestamp <= 30 * 24 * 60 * 60 * 1000;
			case 'past-7':
				return Date.now() - stat.creationTimestamp <= 7 * 24 * 60 * 60 * 1000;
			case 'all-time':
			default:
				return true;
		}
	}

	private rankFilter(stat: GameStat, prefs: Preferences) {
		if (!prefs.bgsActiveRankFilter) {
			return true;
		}

		switch (prefs.bgsActiveRankFilter) {
			case 'all':
				return true;
			default:
				return stat.playerRank && parseInt(stat.playerRank) >= parseInt(prefs.bgsActiveRankFilter);
		}
	}

	private buildSortingFunction(prefs: Preferences): (a: BgsHeroStat, b: BgsHeroStat) => number {
		switch (prefs.bgsActiveHeroSortFilter) {
			case 'games-played':
				return (a, b) => b.playerGamesPlayed - a.playerGamesPlayed;
			case 'mmr':
				return (a, b) => {
					if (!a.playerAverageMmr && !b.playerAverageMmr) {
						return b.playerGamesPlayed - a.playerGamesPlayed;
					}
					if (!a.playerAverageMmr) {
						return 1;
					}
					if (!b.playerAverageMmr) {
						return -1;
					}
					return b.playerAverageMmr - a.playerAverageMmr;
				};
			case 'average-position':
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
