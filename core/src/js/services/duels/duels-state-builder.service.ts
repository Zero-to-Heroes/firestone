/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import {
	DuelsGlobalStats,
	HeroPowerStat,
	HeroStat,
	SignatureTreasureStat,
	TreasureStat,
} from '@firestone-hs/retrieve-duels-global-stats/dist/stat';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { Input } from '@firestone-hs/retrieve-users-duels-runs/dist/input';
import {
	DuelsHeroPlayerStat,
	DuelsPlayerStats,
	DuelsTreasureStat,
	DuelsTreasureStatForClass,
} from '../../models/duels/duels-player-stats';
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
// const DUELS_GLOBAL_STATS_URL = 'https://3cv8xm5w6k.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';
const DUELS_GLOBAL_STATS_URL = 'https://static-api.firestoneapp.com/retrieveDuelsGlobalStats/{proxy+}';

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
		const results: any = await this.api.callGetApiWithRetries(DUELS_GLOBAL_STATS_URL);
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
				name: 'Heroes',
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-treasures',
				name: 'Treasures',
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
			activeStatTypeFilter: prefs.duelsActiveStatTypeFilter,
			activeTreasureSortFilter: prefs.duelsActiveTreasureSortFilter,
			activeTreasureStatTypeFilter: prefs.duelsActiveTreasureStatTypeFilter,
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
		const treasureStats: readonly DuelsTreasureStat[] = this.buildTreasureStats(
			runs,
			globalStats.treasureStats,
			prefs,
		);
		console.log('[duels-state-builder] built trasure stats', treasureStats);
		return {
			heroStats: heroStats,
			heroPowerStats: heroPowerStats,
			signatureTreasureStats: signatureTreasureStats,
			treasureStats: treasureStats,
		} as DuelsPlayerStats;
	}

	private buildTreasureStats(
		runs: readonly DuelsRun[],
		treasureStats: readonly TreasureStat[],
		prefs: Preferences,
	): readonly DuelsTreasureStat[] {
		const groupedByTreasures = groupByFunction((stat: TreasureStat) => stat.cardId)(treasureStats);
		const treasureIds = Object.keys(groupedByTreasures);
		const totalTreasureOfferings = treasureStats.map(stat => stat.totalOffered).reduce((a, b) => a + b, 0);
		const totalPick = treasureStats.map(stat => stat.totalPicked).reduce((a, b) => a + b, 0);
		if (totalPick * 3 !== totalTreasureOfferings) {
			console.error('[duels-state-builder] invalid data', totalPick, totalTreasureOfferings, treasureStats);
		}
		return treasureIds
			.map(treasureId => {
				const statsForTreasure: readonly TreasureStat[] = groupedByTreasures[treasureId];
				return this.buildTreasureStat(treasureId, statsForTreasure, runs, totalTreasureOfferings);
			})
			.filter(stat => stat.globalTotalMatches > 0)
			.sort(this.getTreasureSortFunction(prefs));
	}

	private buildTreasureStat(
		treasureId: string,
		statsForTreasure: readonly TreasureStat[],
		runs: readonly DuelsRun[],
		totalTreasureOfferings: number,
	): DuelsTreasureStat {
		const groupedByClass = groupByFunction((stat: TreasureStat) => stat.playerClass)(statsForTreasure);
		const totalTreasureOfferingsForTreasure = statsForTreasure
			.map(stat => stat.totalOffered)
			.reduce((a, b) => a + b, 0);
		const statsForClass: readonly DuelsTreasureStatForClass[] = Object.keys(groupedByClass).map(playerClass => {
			const classStats: readonly TreasureStat[] = groupedByClass[playerClass];
			return this.buildTreasureForClass(treasureId, playerClass, classStats, totalTreasureOfferingsForTreasure);
		});
		const globalTotalOffered = statsForClass.map(stat => stat.globalTotalOffered).reduce((a, b) => a + b, 0);
		const globalTotalPicked = statsForClass.map(stat => stat.globalTotalPicked).reduce((a, b) => a + b, 0);
		const globalTotalMatches = statsForClass.map(stat => stat.globalTotalMatches).reduce((a, b) => a + b, 0);
		const globalTotalWins = statsForClass.map(stat => stat.globalTotalWins).reduce((a, b) => a + b, 0);
		const globalTotalLosses = statsForClass.map(stat => stat.globalTotalLosses).reduce((a, b) => a + b, 0);
		const globalTotalTies = statsForClass.map(stat => stat.globalTotalTies).reduce((a, b) => a + b, 0);

		const treasureOfferings = runs
			.map(run => run.steps)
			.reduce((a, b) => a.concat(b), [])
			.filter(step => (step as DuelsRunInfo).bundleType === 'treasure')
			.map(step => step as DuelsRunInfo)
			.filter(step => step.option1 === treasureId || step.option2 === treasureId || step.option3 === treasureId);
		const playerPickRate =
			treasureOfferings.length === 0
				? null
				: (100 *
						treasureOfferings.filter(
							step =>
								(step.chosenOptionIndex === 1 && step.option1 === treasureId) ||
								(step.chosenOptionIndex === 2 && step.option2 === treasureId) ||
								(step.chosenOptionIndex === 3 && step.option3 === treasureId),
						).length) /
				  treasureOfferings.length;
		return {
			cardId: treasureId,
			periodStart: statsForClass[0].periodStart,
			statsForClass: statsForClass,
			globalTotalOffered: globalTotalOffered,
			globalTotalPicked: globalTotalPicked,
			globalOfferingRate: (3 * 100 * globalTotalOffered) / totalTreasureOfferings,
			globalPickRate: (100 * globalTotalPicked) / globalTotalOffered,
			globalTotalMatches: globalTotalMatches,
			globalTotalWins: globalTotalWins,
			globalTotalLosses: globalTotalLosses,
			globalTotalTies: globalTotalTies,
			globalWinrate: globalTotalMatches === 0 ? null : (100 * globalTotalWins) / globalTotalMatches,
			playerPickRate: playerPickRate,
			// playerWinrate: playerWinrate,
		} as DuelsTreasureStat;
	}

	private buildTreasureForClass(
		treasureId: string,
		playerClass: string,
		classStats: readonly TreasureStat[],
		totalTreasureOfferingsForTreasure: number,
	): DuelsTreasureStatForClass {
		const globalTotalOffered = classStats.map(stat => stat.totalOffered).reduce((a, b) => a + b, 0);
		const globalTotalPicked = classStats.map(stat => stat.totalPicked).reduce((a, b) => a + b, 0);
		const globalTotalMatches = classStats.map(stat => stat.matchesPlayed).reduce((a, b) => a + b, 0);
		const globalTotalWins = classStats.map(stat => stat.totalWins).reduce((a, b) => a + b, 0);
		const globalTotalLosses = classStats.map(stat => stat.totalLosses).reduce((a, b) => a + b, 0);
		const globalTotalTies = classStats.map(stat => stat.totalTies).reduce((a, b) => a + b, 0);

		return {
			cardId: treasureId,
			playerClass: playerClass,
			periodStart: classStats[0].periodStart,
			globalTotalOffered: globalTotalOffered,
			globalTotalPicked: globalTotalPicked,
			globalOfferingRate: (3 * 100 * globalTotalOffered) / totalTreasureOfferingsForTreasure,
			globalPickRate: (100 * globalTotalPicked) / globalTotalOffered,
			globalTotalMatches: globalTotalMatches,
			globalTotalWins: globalTotalWins,
			globalTotalLosses: globalTotalLosses,
			globalTotalTies: globalTotalTies,
			globalWinrate: globalTotalMatches === 0 ? null : (100 * globalTotalWins) / globalTotalMatches,
		} as DuelsTreasureStatForClass;
	}

	private buildStats(
		runs: readonly DuelsRun[],
		stats: readonly (HeroStat | HeroPowerStat | SignatureTreasureStat)[],
		idExtractor: (stat: HeroStat | HeroPowerStat | SignatureTreasureStat) => string,
		prefs: Preferences,
	): readonly DuelsHeroPlayerStat[] {
		const totalMatchesForPlayer = runs.map(run => run.wins + run.losses).reduce((a, b) => a + b, 0);
		const totalStats = stats.map(stat => stat.totalMatches).reduce((a, b) => a + b, 0);
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
					globalPopularity: totalStats === 0 ? 0 : (100 * stat.totalMatches) / totalStats,
					globalWinrate: stat.totalMatches === 0 ? 0 : (100 * stat.totalWins) / stat.totalMatches,
					playerTotalMatches: playerTotalMatches,
					playerPopularity:
						totalMatchesForPlayer === 0 ? 0 : (100 * playerTotalMatches) / totalMatchesForPlayer,
					playerWinrate:
						playerTotalMatches === 0
							? 0
							: (100 *
									runs
										.filter(run => run.heroCardId === idExtractor(stat))
										.map(run => run.wins)
										.reduce((a, b) => a + b, 0)) /
							  playerTotalMatches,
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

	private getTreasureSortFunction(prefs: Preferences): (a: DuelsTreasureStat, b: DuelsTreasureStat) => number {
		switch (prefs.duelsActiveTreasureSortFilter) {
			case 'global-offering':
				return (a, b) => b.globalOfferingRate - a.globalOfferingRate;
			case 'player-pickrate':
				return (a, b) => b.playerPickRate - a.playerPickRate;
			case 'global-pickrate':
				return (a, b) => b.globalPickRate - a.globalPickRate;
			case 'global-winrate':
			default:
				return (a, b) => b.globalWinrate - a.globalWinrate;
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
