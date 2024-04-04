/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { decode, encode } from '@firestone-hs/deckstrings';
import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import {
	DuelsDeckStatInfo,
	DuelsDeckSummary,
	DuelsDeckSummaryForType,
	DuelsPersonalDecksService,
	DuelsRun,
	HeroPowerDuelsDeckStatInfo,
	LootDuelsDeckStatInfo,
	SignatureTreasureDuelsDeckStatInfo,
	TreasureDuelsDeckStatInfo,
} from '@firestone/duels/general';
import { PreferencesService } from '@firestone/shared/common/service';
import { sanitizeDeckDefinition, sanitizeDeckstring } from '@firestone/shared/common/view';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	CardsFacadeService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { getDuelsModeName, isDuels } from '@services/duels/duels-utils';
import { combineLatest, concat } from 'rxjs';
import { distinctUntilChanged, filter, map, take } from 'rxjs/operators';
import { formatClass } from '../hs-utils';
import { LocalizationFacadeService } from '../localization-facade.service';
import { GameStatsProviderService } from '../stats/game/game-stats-provider.service';
import { arraysEqual, deepEqual, groupByFunction } from '../utils';
import { DuelsUserRunsService } from './duels-user-runs.service';

@Injectable()
export class DuelsDecksProviderService extends AbstractFacadeService<DuelsDecksProviderService> {
	public duelsRuns$$: SubscriberAwareBehaviorSubject<readonly DuelsRun[]>;
	public duelsDecks$$: SubscriberAwareBehaviorSubject<readonly DuelsDeckSummary[]>;

	private allCards: CardsFacadeService;
	private i18n: LocalizationFacadeService;
	private duelsUserRuns: DuelsUserRunsService;
	private duelsPersonalDecks: DuelsPersonalDecksService;
	private gameStats: GameStatsProviderService;
	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'DuelsDecksProviderService', () => !!this.duelsRuns$$);
	}

	protected override assignSubjects() {
		this.duelsRuns$$ = this.mainInstance.duelsRuns$$;
		this.duelsDecks$$ = this.mainInstance.duelsDecks$$;
	}

	protected async init() {
		this.duelsRuns$$ = new SubscriberAwareBehaviorSubject<readonly DuelsRun[] | null>(null);
		this.duelsDecks$$ = new SubscriberAwareBehaviorSubject<readonly DuelsDeckSummary[] | null>(null);
		this.allCards = AppInjector.get(CardsFacadeService);
		this.i18n = AppInjector.get(LocalizationFacadeService);
		this.duelsUserRuns = AppInjector.get(DuelsUserRunsService);
		this.duelsPersonalDecks = AppInjector.get(DuelsPersonalDecksService);
		this.gameStats = AppInjector.get(GameStatsProviderService);
		this.prefs = AppInjector.get(PreferencesService);

		await Promise.all([this.duelsPersonalDecks.isReady(), this.gameStats.isReady(), this.prefs.isReady()]);

		this.duelsRuns$$.onFirstSubscribe(() => {
			console.log('[duels-runs] init duels runs');
			// The idea is to compute the initial value, whatever the most recent game is, and
			// once this is done, we only recompute things once the most recent stat is not empty
			const runSourceFirstValue$ = combineLatest([
				this.duelsUserRuns.duelsRuns$$,
				this.duelsUserRuns.duelsRewards$$,
				this.gameStats.gameStats$$,
			]).pipe(
				filter(([duelsRunInfos, duelsRewardsInfo, gameStats]) => duelsRunInfos != null && !!gameStats?.length),
				take(1),
			);
			const runSourceFilteredValues$ = combineLatest([
				this.duelsUserRuns.duelsRuns$$,
				this.duelsUserRuns.duelsRewards$$,
				this.gameStats.gameStats$$,
			]).pipe(
				filter(
					([duelsRunInfos, duelsRewardsInfo, gameStats]) =>
						duelsRunInfos != null && !!gameStats?.length && isDuels(gameStats[0]?.gameMode),
				),
			);
			concat(runSourceFirstValue$, runSourceFilteredValues$)
				.pipe(
					map(([duelsRunInfos, duelsRewardsInfo, gameStats]) => {
						const duelMatches =
							gameStats?.filter((match) => isDuels(match.gameMode)).filter((match) => match.runId) ?? [];
						const matchesByRun = groupByFunction((match: GameStat) => match.runId)(duelMatches);
						const runIds = Object.keys(matchesByRun);
						const runs: readonly DuelsRun[] = runIds
							.map((runId) =>
								this.buildRun(
									runId,
									matchesByRun[runId],
									duelsRunInfos?.filter((runInfo) => runInfo.runId === runId) ?? [],
									duelsRewardsInfo?.filter((runInfo) => runInfo.runId === runId) ?? [],
								),
							)
							.filter((run) => run);
						console.debug('[duels-runs] rebuilding runs', {
							runs,
							duelsRunInfos,
							duelsRewardsInfo,
							duelGames: gameStats?.filter((match) => isDuels(match.gameMode)),
							duelGamesWithRunId: duelMatches,
							gameStats,
						});
						return runs;
					}),
				)
				.subscribe(this.duelsRuns$$);
		});

		this.duelsDecks$$.onFirstSubscribe(() => {
			console.log('[duels-decks] init duels decks');
			combineLatest([
				this.duelsRuns$$.asObservable(),
				this.duelsPersonalDecks.decks$$,
				this.prefs.preferences$$.pipe(map((prefs) => prefs.duelsPersonalDeckNames)),
			])
				.pipe(
					distinctUntilChanged((a, b) => arraysEqual(a, b)),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
					map(([runs, duelsPersonalAdditionalDecks, duelsPersonalDeckNames]) =>
						this.buildPersonalDeckStats(runs, duelsPersonalAdditionalDecks ?? [], duelsPersonalDeckNames),
					),
				)
				.subscribe(this.duelsDecks$$);
		});
	}

	private buildPersonalDeckStats(
		runs: readonly DuelsRun[],
		duelsPersonalAdditionalDecks: readonly DuelsDeckSummary[],
		duelsPersonalDeckNames: { [deckstring: string]: string },
	): readonly DuelsDeckSummary[] {
		if (!runs?.length) {
			return [];
		}

		const groupedByDecklist: { [deckstring: string]: readonly DuelsRun[] } = groupByFunction(
			(run: DuelsRun) => run.initialDeckList,
		)(runs.filter((run) => run.initialDeckList));
		const decks: DuelsDeckSummary[] = Object.keys(groupedByDecklist)
			.filter((deckstring) => deckstring)
			.map((deckstring) => {
				const groupedByType: { [deckstring: string]: readonly DuelsRun[] } = groupByFunction(
					(run: DuelsRun) => run.type,
				)(groupedByDecklist[deckstring] ?? []);

				const decksForTypes: readonly DuelsDeckSummaryForType[] = Object.keys(groupedByType).map((type) => {
					return {
						type: type,
						...this.buildMainPersonalDecktats(groupedByType[type]),
					} as DuelsDeckSummaryForType;
				});
				const firstMatch = groupedByDecklist[deckstring][0];
				const heroCardId = firstMatch.heroCardId;
				const mainStats = this.buildMainPersonalDecktats(groupedByDecklist[deckstring]);
				const playerClass = this.allCards.getCard(heroCardId)?.playerClass?.toLowerCase();

				const defaultDeckName = this.i18n.translateString('app.duels.deck-stat.default-deck-name', {
					wins: mainStats.global.averageWinsPerRun.toFixed(1),
					playerClass: formatClass(playerClass, this.i18n),
					gameMode: getDuelsModeName(firstMatch.type, this.i18n),
				});

				// Make sure the decklist doesn't include signature treasures
				try {
					const sanitizedDeckstring = sanitizeDeckstring(firstMatch.initialDeckList, this.allCards);
					return {
						...mainStats,
						initialDeckList: sanitizedDeckstring,
						heroCardId: heroCardId,
						playerClass: playerClass,
						deckStatsForTypes: decksForTypes,
						// FIXME: use prefs in component to override deck name
						deckName: this.getDeckName(sanitizedDeckstring, duelsPersonalDeckNames) ?? defaultDeckName,
						runs: groupedByDecklist[deckstring],
					} as any as DuelsDeckSummary;
				} catch (e) {
					console.warn('invalid deckstring', firstMatch.id, firstMatch.initialDeckList, e);
					return null;
				}
			});
		for (const personalDeck of duelsPersonalAdditionalDecks) {
			if (decks.find((deck) => deck.initialDeckList === personalDeck.initialDeckList)) {
				continue;
			}
			decks.push(personalDeck);
		}
		return decks;
	}

	private buildDeckStatInfo(runs: readonly DuelsRun[]): DuelsDeckStatInfo {
		const totalMatchesPlayed = runs.map((run) => run.wins + run.losses).reduce((a, b) => a + b, 0);
		return {
			totalRunsPlayed: runs.length,
			totalMatchesPlayed: totalMatchesPlayed,
			winrate: (100 * runs.map((run) => run.wins).reduce((a, b) => a + b, 0)) / totalMatchesPlayed,
			averageWinsPerRun: runs.map((run) => run.wins).reduce((a, b) => a + b, 0) / runs.length,
			winsDistribution: this.buildWinDistributionForRun(runs),
			netRating: runs
				.filter((run) => run.ratingAtEnd != null && run.ratingAtStart != null)
				.map((run) => +run.ratingAtEnd - +run.ratingAtStart)
				.reduce((a, b) => a + b, 0),
		} as DuelsDeckStatInfo;
	}

	private buildWinDistributionForRun(runs: readonly DuelsRun[]): readonly { winNumber: number; value: number }[] {
		const result: { winNumber: number; value: number }[] = [];
		for (let i = 0; i <= 12; i++) {
			result.push({
				winNumber: i,
				value: runs.filter((run) => run.wins === i).length,
			});
		}
		return result;
	}

	private getDeckName(initialDeckList: string, duelsPersonalDeckNames: { [deckstring: string]: string }): string {
		return duelsPersonalDeckNames[initialDeckList] ?? null;
	}

	private buildMainPersonalDecktats(runs: readonly DuelsRun[]): {
		readonly global: DuelsDeckStatInfo;
		readonly heroPowerStats: readonly HeroPowerDuelsDeckStatInfo[];
		readonly signatureTreasureStats: readonly SignatureTreasureDuelsDeckStatInfo[];
		readonly treasureStats: readonly TreasureDuelsDeckStatInfo[];
		readonly lootStats: readonly LootDuelsDeckStatInfo[];
	} {
		const groupedByHeroPower = groupByFunction((run: DuelsRun) => run.heroPowerCardId)(runs);
		const heroPowerStats: readonly HeroPowerDuelsDeckStatInfo[] = Object.keys(groupedByHeroPower).map(
			(heroPowerCardId) => ({
				...this.buildDeckStatInfo(groupedByHeroPower[heroPowerCardId]),
				heroPowerCardId: heroPowerCardId,
			}),
		);

		const groupedBySignatureTreasure = groupByFunction((run: DuelsRun) => run.signatureTreasureCardId)(runs);
		const signatureTreasureStats: readonly SignatureTreasureDuelsDeckStatInfo[] = Object.keys(
			groupedBySignatureTreasure,
		).map((signatureTreasureCardId) => ({
			...this.buildDeckStatInfo(groupedBySignatureTreasure[signatureTreasureCardId]),
			signatureTreasureCardId: signatureTreasureCardId,
		}));

		const extractTreasuresForRun = (run: DuelsRun) => {
			return run.steps
				.filter((step) => (step as DuelsRunInfo).bundleType === 'treasure')
				.map((step) => step as DuelsRunInfo)
				.map((step) =>
					step.chosenOptionIndex === 1
						? step.option1
						: step.chosenOptionIndex === 2
						? step.option2
						: step.chosenOptionIndex === 2
						? step.option3
						: null,
				)
				.filter((treasure) => treasure);
		};
		const allTreasures: readonly string[] = [
			...new Set(runs.map((run) => extractTreasuresForRun(run)).reduce((a, b) => a.concat(b), [])),
		];
		const treasureStats: readonly TreasureDuelsDeckStatInfo[] = allTreasures.map((treasureId) => {
			const runsWithTreasure: readonly DuelsRun[] = runs.filter((run) =>
				extractTreasuresForRun(run).includes(treasureId),
			);
			return {
				...this.buildDeckStatInfo(runsWithTreasure),
				cardId: treasureId,
			};
		});

		const extractLootsForRun = (run: DuelsRun) => {
			return run.steps
				.filter((step) => (step as DuelsRunInfo).bundleType === 'loot')
				.map((step) => step as DuelsRunInfo)
				.map((step) =>
					step.chosenOptionIndex === 1
						? step.option1Contents
						: step.chosenOptionIndex === 2
						? step.option2Contents
						: step.chosenOptionIndex === 2
						? step.option3Contents
						: null,
				)
				.reduce((a, b) => a.concat(b), [])
				.filter((cardId) => cardId);
		};
		const allCardLooted: readonly string[] = [
			...new Set(runs.map((run) => extractLootsForRun(run)).reduce((a, b) => a.concat(b), [])),
		];
		const lootStats: readonly LootDuelsDeckStatInfo[] = allCardLooted.map((cardId) => {
			const runsWithTheLoot: readonly DuelsRun[] = runs.filter((run) => extractLootsForRun(run).includes(cardId));
			return {
				...this.buildDeckStatInfo(runsWithTheLoot),
				cardId: cardId,
			};
		});

		return {
			global: this.buildDeckStatInfo(runs),
			heroPowerStats: heroPowerStats,
			signatureTreasureStats: signatureTreasureStats,
			treasureStats: treasureStats,
			lootStats: lootStats,
		};
	}

	private buildRun(
		runId: string,
		matchesForRun: readonly GameStat[],
		runInfo: readonly DuelsRunInfo[],
		rewardsInfo: readonly DuelsRewardsInfo[],
	): DuelsRun {
		if (!matchesForRun && !runInfo) {
			return null;
		}
		const sortedMatches = [...matchesForRun].sort((a, b) => (a.creationTimestamp <= b.creationTimestamp ? -1 : 1));
		const firstMatch = this.getFirstMatchForRun(sortedMatches);
		const sortedInfo = [...runInfo].sort((a, b) => (a.creationTimestamp <= b.creationTimestamp ? -1 : 1));
		const steps: readonly (GameStat | DuelsRunInfo)[] = [...(sortedMatches || []), ...(sortedInfo || [])].sort(
			(a, b) => (a.creationTimestamp <= b.creationTimestamp ? -1 : 1),
		);
		const [wins, losses] = this.extractWins(sortedMatches);
		let normalizedDeckstring = firstMatch?.playerDecklist;
		if (!!firstMatch?.playerDecklist) {
			try {
				console.debug('decoding', firstMatch?.playerDecklist, firstMatch);
				const deckDefinition = decode(firstMatch?.playerDecklist);
				const updatedDeckDefinition = sanitizeDeckDefinition(deckDefinition, this.allCards);
				normalizedDeckstring = encode(updatedDeckDefinition);
			} catch (e) {
				console.warn('invalid deckstring', firstMatch.reviewId, firstMatch.playerDecklist, e);
				return null;
			}
		}
		const result = DuelsRun.create({
			id: runId,
			type: this.getDuelsType(steps[0]),
			creationTimestamp: steps[0].creationTimestamp,
			buildNumberAtStart: firstMatch?.buildNumber,
			heroCardId: this.extractHeroCardId(sortedMatches),
			heroPowerCardId: this.extractHeroPowerCardId(sortedInfo),
			signatureTreasureCardId: this.extractSignatureTreasureCardId(sortedInfo),
			initialDeckList: normalizedDeckstring,
			wins: wins,
			losses: losses,
			ratingAtStart: this.extractRatingAtStart(sortedMatches),
			ratingAtEnd: this.extractRatingAtEnd(sortedMatches),
			steps: steps,
			rewards: rewardsInfo,
		} as DuelsRun);
		return result;
	}

	private getFirstMatchForRun(sortedMatches: readonly GameStat[]): GameStat {
		const firstMatch = sortedMatches[0];
		const [wins, losses] = firstMatch.additionalResult?.split('-')?.map((info) => parseInt(info)) ?? [null, null];
		if (wins !== 0 || losses !== 0) {
			return null;
		}
		return firstMatch;
	}

	private extractRatingAtEnd(sortedMatches: readonly GameStat[]): number {
		if (sortedMatches.length === 0) {
			return null;
		}
		const lastMatch = sortedMatches[sortedMatches.length - 1];
		return lastMatch.newPlayerRank ? parseInt(lastMatch.newPlayerRank) : null;
	}

	private extractRatingAtStart(sortedMatches: readonly GameStat[]): number {
		const validMatches = sortedMatches.filter((m) => m.playerRank != null);
		if (validMatches.length === 0) {
			return null;
		}
		const lastMatch = validMatches[validMatches.length - 1];
		return lastMatch.playerRank != null ? parseInt(lastMatch.playerRank) : null;
	}

	private extractWins(sortedMatches: readonly GameStat[]): [number, number] {
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

	private extractSignatureTreasureCardId(steps: readonly DuelsRunInfo[]): string {
		if (!steps || steps.length === 0) {
			return null;
		}
		return steps.find((step) => step.bundleType === 'signature-treasure')?.option1;
	}

	private extractHeroPowerCardId(steps: readonly DuelsRunInfo[]): string {
		if (!steps || steps.length === 0) {
			return null;
		}
		const result = steps.find((step) => step.bundleType === 'hero-power')?.option1;
		return result;
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
}
