/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { DraftDeckStats } from '@firestone-hs/arena-draft-pick';
import { decode } from '@firestone-hs/deckstrings';
import { BnetRegion } from '@firestone-hs/reference-data';
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
	CardsFacadeService,
	WindowManagerService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { GAME_STATS_PROVIDER_SERVICE_TOKEN, IGameStatsProviderService } from '@firestone/stats/common';
import { GameStat } from '@firestone/stats/data-access';
import { Observable, combineLatest, debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
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
	private allCards: CardsFacadeService;

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
		this.allCards = AppInjector.get(CardsFacadeService);

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
					debounceTime(500),
					distinctUntilChanged(
						(a, b) =>
							a[0]?.length === b[0]?.length &&
							a[1]?.length === b[1]?.length &&
							// We update the info in place here while a draft is in progress
							deepEqual(a[2], b[2]),
					),
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
						region: prefs.regionFilter,
					})),
					distinctUntilChanged(
						(a, b) =>
							a.timeFilter === b.timeFilter && a.heroFilter === b.heroFilter && a.region === b.region,
					),
				),
				this.patchesConfig.currentArenaMetaPatch$$,
				this.patchesConfig.currentArenaSeasonPatch$$,
			])
				.pipe(
					filter(([runs, { timeFilter, heroFilter }]) => !!runs?.length),
					map(([runs, { timeFilter, heroFilter, region }, patch, seasonPatch]) => {
						const filteredRuns = runs!
							.filter((match) => isCorrectRegion(match, region))
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

	public getArenaRun$(runId: string): Observable<ArenaRun | null | undefined> {
		return this.allRuns$$.pipe(map((runs) => runs?.find((run) => run.id === runId)));
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
		const runsWithGames = Object.keys(matchesGroupedByRun).map((runId: string) => {
			const matches: readonly GameStat[] = matchesGroupedByRun[runId];
			const rewards = rewardsGroupedByRun[runId];
			const draftStat = deckStats?.find((stat) => stat.runId === runId);
			const firstMatch = matches[0];
			const sortedMatches = [...matches].sort((a, b) => a.creationTimestamp - b.creationTimestamp);
			const [wins, losses] = this.extractWins(sortedMatches);
			return ArenaRun.create({
				id: firstMatch.runId,
				creationTimestamp: firstMatch.creationTimestamp,
				heroCardId: firstMatch.playerCardId,
				initialDeckList: firstMatch.playerDecklist,
				wins: wins ?? undefined,
				losses: losses ?? undefined,
				steps: matches,
				rewards: rewards,
				draftStat: draftStat,
				totalCardsInDeck: 30, // TODO don't hard code this, but don't decode all the decks just for fun
			});
		});
		const runsWithoutGames =
			deckStats
				?.filter((s) => !matchesGroupedByRun[s.runId])
				?.map((stat) => {
					return ArenaRun.create({
						id: stat.runId,
						creationTimestamp: stat.creationTimestamp,
						heroCardId: stat.heroCardId,
						initialDeckList: stat.initialDeckList,
						steps: [],
						rewards: rewardsGroupedByRun[stat.runId],
						draftStat: stat,
						totalCardsInDeck: !stat.initialDeckList
							? 0
							: decode(stat.initialDeckList)
									.cards?.map((c) => c[1])
									.reduce((a, b) => a + b, 0) ?? 0,
					});
				})
				.filter((r) => r.creationTimestamp) ?? [];
		const result = [...runsWithGames, ...runsWithoutGames].sort(
			(a, b) => b.creationTimestamp - a.creationTimestamp,
		);
		console.debug(
			'[arena-runs] result',
			result,
			result.sort((a, b) => b.creationTimestamp - a.creationTimestamp),
		);
		return result;
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
		return (
			!heroFilter ||
			heroFilter === 'all' ||
			this.allCards.getCard(run.heroCardId).classes?.includes(heroFilter?.toUpperCase()) ||
			run.getFirstMatch()?.playerClass?.toLowerCase() === heroFilter ||
			false
		);
	}
}

export const isCorrectRegion = (run: ArenaRun, region: BnetRegion | 'all'): boolean => {
	// console.debug(
	// 	'isCorrectRegion',
	// 	region === 'all' || run.draftStat?.region === region || run.getFirstMatch()?.region === region,
	// 	region === 'all',
	// 	run.draftStat?.region === region,
	// 	run.getFirstMatch()?.region === region,
	// 	run,
	// 	region,
	// );
	return region === 'all' || run.draftStat?.region === region || run.getFirstMatch()?.region === region;
};

export const isCorrectTime = (
	run: ArenaRun,
	timeFilter: ArenaTimeFilterType,
	patch: PatchInfo | null,
	seasonPatch: PatchInfo | null,
): boolean => {
	if (timeFilter === 'all-time') {
		return true;
	}

	const timestamp = run.creationTimestamp ?? run.getFirstMatch()?.creationTimestamp;
	// Don't use the build number so we can more easily fit in ongoing drafts
	// const buildNumber = run.getFirstMatch()?.buildNumber ?? 0;

	switch (timeFilter) {
		case 'last-patch':
			return !!patch && timestamp > new Date(patch.date).getTime();
		case 'current-season':
			return !!seasonPatch && timestamp > new Date(seasonPatch.date).getTime();
		case 'past-three':
			return Date.now() - timestamp < 3 * 24 * 60 * 60 * 1000;
		case 'past-seven':
			return Date.now() - timestamp < 7 * 24 * 60 * 60 * 1000;
		default:
			return true;
	}
};
