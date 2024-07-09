/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { DraftDeckStats } from '@firestone-hs/arena-draft-pick';
import {
	ArenaClassFilterType,
	ArenaTimeFilterType,
	PatchInfo,
	PatchesConfigService,
	PreferencesService,
} from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject, deepEqual, groupByFunction } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	WindowManagerService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { GAME_STATS_PROVIDER_SERVICE_TOKEN, IGameStatsProviderService } from '@firestone/stats/common';
import { GameStat } from '@firestone/stats/data-access';
import { combineLatest, distinctUntilChanged, filter, map } from 'rxjs';
import { ArenaRun } from '../models/arena-run';
import { ArenaDeckStatsService } from './arena-deck-stats.service';
import { ArenaRewardsService } from './arena-rewards.service';

@Injectable()
export class ArenaRunsService extends AbstractFacadeService<ArenaRunsService> {
	public allRuns$$: SubscriberAwareBehaviorSubject<readonly ArenaRun[] | null | undefined>;
	public runs$$: SubscriberAwareBehaviorSubject<readonly ArenaRun[] | null | undefined>;

	private prefs: PreferencesService;
	private gameStats: IGameStatsProviderService;
	private patchesConfig: PatchesConfigService;
	private arenaRewards: ArenaRewardsService;
	private arenaDeckStats: ArenaDeckStatsService;

	private internalSub$$ = new SubscriberAwareBehaviorSubject<null>(null);

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaRunsService', () => !!this.runs$$);
	}

	protected override assignSubjects() {
		this.allRuns$$ = this.mainInstance.allRuns$$;
		this.runs$$ = this.mainInstance.runs$$;
	}

	protected async init() {
		this.allRuns$$ = new SubscriberAwareBehaviorSubject<readonly ArenaRun[] | null | undefined>(null);
		this.runs$$ = new SubscriberAwareBehaviorSubject<readonly ArenaRun[] | null | undefined>(null);
		this.prefs = AppInjector.get(PreferencesService);
		this.gameStats = AppInjector.get(GAME_STATS_PROVIDER_SERVICE_TOKEN);
		this.patchesConfig = AppInjector.get(PatchesConfigService);
		this.arenaRewards = AppInjector.get(ArenaRewardsService);
		this.arenaDeckStats = AppInjector.get(ArenaDeckStatsService);

		await waitForReady(this.prefs, this.gameStats, this.patchesConfig, this.arenaRewards, this.arenaDeckStats);

		this.runs$$.onFirstSubscribe(() => {
			this.internalSub$$.subscribe();
		});
		this.allRuns$$.onFirstSubscribe(() => {
			this.internalSub$$.subscribe();
		});

		this.internalSub$$.onFirstSubscribe(() => {
			combineLatest([
				this.gameStats.gameStats$$,
				this.arenaRewards.arenaRewards$$,
				this.arenaDeckStats.deckStats$$,
			])
				.pipe(
					filter(([stats, rewards, deckStats]) => !!stats?.length),
					map(([stats, rewards, deckStats]) => {
						const arenaMatches = stats
							?.filter((stat) => stat.gameMode === 'arena')
							.filter((stat) => !!stat.runId);
						const arenaRuns = this.buildArenaRuns(arenaMatches, rewards, deckStats);
						const filteredRuns = arenaRuns;
						return filteredRuns;
					}),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
				)
				.subscribe((runs) => {
					console.debug('[arena-runs] allRuns', runs);
					this.allRuns$$.next(runs);
				});

			combineLatest([
				this.allRuns$$,
				this.prefs.preferences$$.pipe(
					map((prefs) => ({
						timeFilter: prefs.arenaActiveTimeFilter,
						heroFilter: prefs.arenaActiveClassFilter,
					})),
					distinctUntilChanged((a, b) => a.timeFilter === b.timeFilter && a.heroFilter === b.heroFilter),
				),
				this.patchesConfig.currentArenaMetaPatch$$,
				this.patchesConfig.currentArenaSeasonPatch$$,
			])
				.pipe(
					filter(([runs, { timeFilter, heroFilter }]) => !!runs?.length),
					map(([runs, { timeFilter, heroFilter }, patch, seasonPatch]) => {
						const filteredRuns = runs!
							.filter((match) => this.isCorrectHero(match, heroFilter))
							.filter((match) => isCorrectTime(match, timeFilter, patch, seasonPatch));
						return filteredRuns;
					}),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
				)
				.subscribe((runs) => {
					this.runs$$.next(runs);
				});
		});
	}

	private buildArenaRuns(
		arenaMatches: readonly GameStat[] | null | undefined,
		rewards: readonly ArenaRewardInfo[] | null,
		deckStats: readonly DraftDeckStats[] | null,
	): readonly ArenaRun[] {
		const matchesGroupedByRun = !!arenaMatches?.length
			? groupByFunction((match: GameStat) => match.runId)(arenaMatches)
			: {};
		const rewardsGroupedByRun = !!rewards?.length
			? groupByFunction((reward: ArenaRewardInfo) => reward.runId)(rewards)
			: {};
		return Object.keys(matchesGroupedByRun).map((runId: string) => {
			const matches: readonly GameStat[] = matchesGroupedByRun[runId];
			const rewards = rewardsGroupedByRun[runId];
			const draftStat = deckStats?.find((stat) => stat.runId === runId);
			const firstMatch = matches[0];
			const sortedMatches = [...matches].sort((a, b) => a.creationTimestamp - b.creationTimestamp);
			const [wins, losses] = this.extractWins(sortedMatches);
			console.debug('extracted wins', wins, losses, sortedMatches);
			return ArenaRun.create({
				id: firstMatch.runId,
				creationTimestamp: firstMatch.creationTimestamp,
				heroCardId: firstMatch.playerCardId,
				initialDeckList: firstMatch.playerDecklist,
				wins: wins,
				losses: losses,
				steps: matches,
				rewards: rewards,
				draftStat: draftStat,
			} as ArenaRun);
		});
	}

	private extractWins(sortedMatches: readonly GameStat[]): [number | null, number | null] {
		if (sortedMatches.length === 0) {
			return [null, null];
		}
		const lastMatch = sortedMatches[sortedMatches.length - 1];
		if (!lastMatch.additionalResult || lastMatch.additionalResult.indexOf('-') === -1) {
			return [
				sortedMatches.filter((m) => m.result === 'won').length,
				sortedMatches.filter((m) => m.result === 'lost').length,
			];
		}
		const [wins, losses] = lastMatch.additionalResult.split('-').map((info) => parseInt(info));

		return lastMatch.result === 'won' ? [wins + 1, losses] : [wins, losses + 1];
	}
	private isCorrectHero(run: ArenaRun, heroFilter: ArenaClassFilterType): boolean {
		return !heroFilter || heroFilter === 'all' || run.getFirstMatch()?.playerClass?.toLowerCase() === heroFilter;
	}
}

export const isCorrectTime = (
	run: ArenaRun,
	timeFilter: ArenaTimeFilterType,
	patch: PatchInfo | null,
	seasonPatch: PatchInfo | null,
): boolean => {
	if (timeFilter === 'all-time') {
		return true;
	}
	const firstMatch = run.getFirstMatch();
	if (!firstMatch) {
		return false;
	}

	const firstMatchTimestamp = firstMatch.creationTimestamp;
	switch (timeFilter) {
		case 'last-patch':
			return (
				!!patch &&
				((patch.hasNewBuildNumber && (firstMatch.buildNumber ?? 0) >= patch.number) ||
					(!patch.hasNewBuildNumber && firstMatch.creationTimestamp > new Date(patch.date).getTime()))
			);
		case 'current-season':
			return (
				!!seasonPatch &&
				((seasonPatch.hasNewBuildNumber && (firstMatch.buildNumber ?? 0) >= seasonPatch.number) ||
					(!seasonPatch.hasNewBuildNumber &&
						firstMatch.creationTimestamp > new Date(seasonPatch.date).getTime()))
			);
		case 'past-three':
			return Date.now() - firstMatchTimestamp < 3 * 24 * 60 * 60 * 1000;
		case 'past-seven':
			return Date.now() - firstMatchTimestamp < 7 * 24 * 60 * 60 * 1000;
		default:
			return true;
	}
};
