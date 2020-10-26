/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { Input } from '@firestone-hs/retrieve-users-duels-runs/dist/input';
import { DuelsRun } from '../../models/duels/duels-run';
import { DuelsState } from '../../models/duels/duels-state';
import { DuelsCategory } from '../../models/mainwindow/duels/duels-category';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { ApiRunner } from '../api-runner';
import { OverwolfService } from '../overwolf.service';
import { groupByFunction } from '../utils';

const DUELS_RUN_INFO_URL = 'https://p6r07hp5jf.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';

@Injectable()
export class DuelsStateBuilderService {
	constructor(private readonly api: ApiRunner, private readonly ow: OverwolfService) {}

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

	public initState(): DuelsState {
		const categories: readonly DuelsCategory[] = this.buildCategories();
		return DuelsState.create({
			categories: categories,
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
		];
	}

	public updateState(
		currentState: DuelsState,
		matchStats: GameStats,
		duelsRunInfo: readonly DuelsRunInfo[],
	): DuelsState {
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
					duelsRunInfo.filter(runInfo => runInfo.runId === runId),
				),
			)
			.filter(run => run)
			.sort(this.getSortFunction());
		console.log('[duels-state-builder] built runs', runs);
		return currentState.update({
			runs: runs,
			loading: false,
		} as DuelsState);
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
