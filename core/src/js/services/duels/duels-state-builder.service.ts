/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import {
	DuelsGlobalStats,
	HeroPowerStat,
	HeroStat,
	SignatureTreasureStat,
} from '@firestone-hs/retrieve-duels-global-stats/dist/stat';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { Input } from '@firestone-hs/retrieve-users-duels-runs/dist/input';
import { DuelsHeroPlayerStat, DuelsPlayerStats } from '../../models/duels/duels-player-stats';
import { DuelsRun } from '../../models/duels/duels-run';
import { DuelsState } from '../../models/duels/duels-state';
import { DuelsCategory } from '../../models/mainwindow/duels/duels-category';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { Preferences } from '../../models/preferences';
import { ApiRunner } from '../api-runner';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { groupByFunction } from '../utils';

const DUELS_RUN_INFO_URL = 'https://p6r07hp5jf.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';
const DUELS_GLOBAL_STATS_URL = 'https://3cv8xm5w6k.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';

@Injectable()
export class DuelsStateBuilderService {
	constructor(
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
	) {}

	public async loadRuns(): Promise<readonly DuelsRunInfo[]> {
		const user = await this.ow.getCurrentUser();
		const input: Input = {
			userId: user.userId,
			userName: user.username,
		};
		const results: any = await this.api.callPostApiWithRetries(DUELS_RUN_INFO_URL, input);
		console.log('[duels-state-builder] loaded result', results?.results);
		return results?.results;
	}

	public async loadGlobalStats(): Promise<DuelsGlobalStats> {
		const results: any = await this.api.callPostApiWithRetries(DUELS_GLOBAL_STATS_URL, null);
		console.log('[duels-state-builder] loaded global stats', results?.result);
		return results?.result;
	}

	public initState(globalStats: DuelsGlobalStats, duelsRunInfo: readonly DuelsRunInfo[]): DuelsState {
		const categories: readonly DuelsCategory[] = this.buildCategories();
		return DuelsState.create({
			categories: categories,
			globalStats: globalStats,
			duelsRunInfos: duelsRunInfo,
		} as DuelsState);
	}

	private buildCategories(): readonly DuelsCategory[] {
		return [
			DuelsCategory.create({
				id: 'duels-runs',
				name: 'Runs',
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-stats',
				name: 'Stats',
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
		];
	}

	public async updateState(currentState: DuelsState, matchStats: GameStats): Promise<DuelsState> {
		const prefs = await this.prefs.getPreferences();
		const duelMatches = matchStats?.stats
			?.filter(match => match.gameMode === 'duels' || match.gameMode === 'paid-duels')
			.filter(match => match.currentDuelsRunId);
		const groupByRunId = groupByFunction((match: GameStat) => match.currentDuelsRunId);
		const matchesByRun = groupByRunId(duelMatches);
		const runIds = Object.keys(matchesByRun);
		const runs: readonly DuelsRun[] = runIds
			.map(runId =>
				this.buildRun(
					runId,
					matchesByRun[runId],
					currentState.duelsRunInfos.filter(runInfo => runInfo.runId === runId),
				),
			)
			.filter(run => run)
			.sort(this.getSortFunction());
		console.log('[duels-state-builder] built runs', runs);

		const playerStats = this.buildStatsWithPlayer(runs, currentState.globalStats, prefs);
		console.log('[duels-state-builder] playerStats', playerStats);
		return currentState.update({
			runs: runs,
			playerStats: playerStats,
			loading: false,
			activeHeroSortFilter: prefs.duelsActiveHeroSortFilter,
		} as DuelsState);
	}

	private buildStatsWithPlayer(
		runs: readonly DuelsRun[],
		globalStats: DuelsGlobalStats,
		prefs: Preferences,
	): DuelsPlayerStats {
		if (!globalStats) {
			return null;
		}
		const totalMatches = runs.map(run => run.wins + run.losses).reduce((a, b) => a + b, 0);
		const heroStats: readonly DuelsHeroPlayerStat[] = this.buildStats(
			runs,
			globalStats.heroStats,
			(stat: HeroStat) => stat.heroCardId,
			prefs,
		);
		const heroPowerStats: readonly DuelsHeroPlayerStat[] = this.buildStats(
			runs,
			globalStats.heroPowerStats,
			(stat: HeroPowerStat) => stat.heroPowerCardId,
			prefs,
		);
		const signatureTreasureStats: readonly DuelsHeroPlayerStat[] = this.buildStats(
			runs,
			globalStats.signatureTreasureStats,
			(stat: SignatureTreasureStat) => stat.signatureTreasureCardId,
			prefs,
		);
		return {
			heroStats: heroStats,
			heroPowerStats: heroPowerStats,
			signatureTreasureStats: signatureTreasureStats,
		} as DuelsPlayerStats;
	}

	private buildStats(
		runs: readonly DuelsRun[],
		stats: readonly (HeroStat | HeroPowerStat | SignatureTreasureStat)[],
		idExtractor: (stat: HeroStat | HeroPowerStat | SignatureTreasureStat) => string,
		prefs: Preferences,
	): readonly DuelsHeroPlayerStat[] {
		const totalMatches = runs.map(run => run.wins + run.losses).reduce((a, b) => a + b, 0);
		return stats
			.map(stat => {
				const playerTotalMatches = runs
					.filter(run => run.heroCardId === idExtractor(stat))
					.map(run => run.wins + run.losses)
					.reduce((a, b) => a + b, 0);
				return {
					cardId: idExtractor(stat),
					heroClass: stat.heroClass,
					periodStart: stat.periodStart,
					globalTotalMatches: stat.totalMatches,
					globalPopularity: stat.popularity,
					globalWinrate: stat.winrate,
					playerTotalMatches: playerTotalMatches,
					playerPopularity: totalMatches === 0 ? 0 : (100 * playerTotalMatches) / totalMatches,
					playerWinrate:
						playerTotalMatches === 0
							? 0
							: runs
									.filter(run => run.heroCardId === idExtractor(stat))
									.map(run => run.wins)
									.reduce((a, b) => a + b, 0) / playerTotalMatches,
				} as DuelsHeroPlayerStat;
			})
			.sort(this.getStatSortFunction(prefs));
	}

	private getStatSortFunction(prefs: Preferences): (a: DuelsHeroPlayerStat, b: DuelsHeroPlayerStat) => number {
		switch (prefs.duelsActiveHeroSortFilter) {
			case 'player-winrate':
				return (a, b) => b.playerWinrate - a.playerWinrate;
			case 'global-winrate':
				return (a, b) => b.globalWinrate - a.globalWinrate;
			case 'games-played':
			default:
				return (a, b) => b.playerTotalMatches - a.playerTotalMatches;
		}
	}

	private buildRun(runId: string, matchesForRun: GameStat[], runInfo: DuelsRunInfo[]): DuelsRun {
		if (!matchesForRun && !runInfo) {
			return null;
		}
		const sortedMatches = matchesForRun.sort((a, b) => (a.creationTimestamp <= b.creationTimestamp ? -1 : 1));
		const sortedInfo = runInfo.sort((a, b) => (a.creationTimestamp <= b.creationTimestamp ? -1 : 1));
		const steps: readonly (GameStat | DuelsRunInfo)[] = [
			...(sortedMatches || []),
			...(sortedInfo || []),
		].sort((a, b) => (a.creationTimestamp <= b.creationTimestamp ? -1 : 1));
		const [wins, losses] = this.extractWins(sortedMatches);
		return DuelsRun.create({
			id: runId,
			type: this.getDuelsType(steps[0]),
			creationTimestamp: steps[0].creationTimestamp,
			heroCardId: this.extractHeroCardId(sortedMatches),
			heroPowerCardId: this.extractHeroPowerCardId(sortedInfo),
			signatureTreasureCardId: this.extractSignatureTreasureCardId(sortedInfo),
			wins: wins,
			losses: losses,
			ratingAtStart: this.extractRatingAtStart(sortedMatches),
			ratingAtEnd: this.extractRatingAtEnd(sortedMatches),
			steps: steps,
		} as DuelsRun);
	}

	private extractRatingAtEnd(sortedMatches: readonly GameStat[]): number {
		if (sortedMatches.length === 0) {
			return null;
		}
		const lastMatch = sortedMatches[sortedMatches.length - 1];
		return lastMatch.newPlayerRank ? parseInt(lastMatch.newPlayerRank) : null;
	}

	private extractRatingAtStart(sortedMatches: readonly GameStat[]): number {
		if (sortedMatches.length === 0) {
			return null;
		}
		const lastMatch = sortedMatches[sortedMatches.length - 1];
		return lastMatch.playerRank ? parseInt(lastMatch.playerRank) : null;
	}

	private extractWins(sortedMatches: readonly GameStat[]): [number, number] {
		if (sortedMatches.length === 0) {
			return [null, null];
		}
		const lastMatch = sortedMatches[sortedMatches.length - 1];
		if (!lastMatch.additionalResult || lastMatch.additionalResult.indexOf('-') === -1) {
			return [null, null];
		}
		const [wins, losses] = lastMatch.additionalResult.split('-').map(info => parseInt(info));
		// console.log('wins, losses', wins, losses, lastMatch.additionalResult.split('-'), lastMatch);
		return lastMatch.result === 'won' ? [wins + 1, losses] : [wins, losses + 1];
	}

	private extractSignatureTreasureCardId(steps: readonly DuelsRunInfo[]): string {
		if (!steps || steps.length === 0) {
			return null;
		}
		return steps.find(step => step.bundleType === 'signature-treasure')?.option1;
	}

	private extractHeroPowerCardId(steps: readonly DuelsRunInfo[]): string {
		if (!steps || steps.length === 0) {
			return null;
		}
		return steps.find(step => step.bundleType === 'hero-power')?.option1;
	}

	private extractHeroCardId(sortedMatches: readonly GameStat[]): string {
		if (sortedMatches.length === 0) {
			return null;
		}
		return sortedMatches[0].playerCardId;
	}

	private getDuelsType(firstStep: DuelsRunInfo | GameStat): 'duels' | 'paid-duels' {
		return (
			(firstStep as DuelsRunInfo).adventureType || ((firstStep as GameStat).gameMode as 'duels' | 'paid-duels')
		);
	}

	private getSortFunction(): (a: DuelsRun, b: DuelsRun) => number {
		return (a: DuelsRun, b: DuelsRun) => {
			if (a.creationTimestamp <= b.creationTimestamp) {
				return 1;
			}
			return -1;
		};
	}
}
