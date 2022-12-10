/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { decode, encode } from '@firestone-hs/deckstrings';
import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { CardsFacadeService } from '@services/cards-facade.service';
import { getDuelsModeName, isDuels } from '@services/duels/duels-utils';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { sanitizeDeckstring } from '../../components/decktracker/copy-deckstring.component';
import {
	DuelsDeckStatInfo,
	DuelsDeckSummary,
	DuelsDeckSummaryForType,
	HeroPowerDuelsDeckStatInfo,
	LootDuelsDeckStatInfo,
	SignatureTreasureDuelsDeckStatInfo,
	TreasureDuelsDeckStatInfo,
} from '../../models/duels/duels-personal-deck';
import { DuelsRun } from '../../models/duels/duels-run';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { formatClass } from '../hs-utils';
import { LocalizationFacadeService } from '../localization-facade.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { arraysEqual, deepEqual, groupByFunction } from '../utils';

@Injectable()
export class DuelsDecksProviderService {
	public duelsRuns$ = new BehaviorSubject<readonly DuelsRun[]>(null);
	public duelsDecks$ = new BehaviorSubject<readonly DuelsDeckSummary[]>(null);

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly store: AppUiStoreFacadeService,
	) {
		window['duelsDecksProvider'] = this;
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		combineLatest([
			this.store.listen$(
				([main, nav]) => main.duels.duelsRunInfos,
				([main, nav]) => main.duels.duelsRewardsInfo,
			),
			this.store.gameStats$(),
		])
			.pipe(
				map(([[duelsRunInfos, duelsRewardsInfo], gameStats]) => {
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
					console.debug('[duels-runs] rebuilding runs', runs, duelsRunInfos, duelsRewardsInfo, gameStats);
					return runs;
				}),
			)
			.subscribe(this.duelsRuns$);

		combineLatest(
			this.duelsRuns$.asObservable(),
			this.store.listenPrefs$(
				(prefs) => prefs.duelsPersonalAdditionalDecks,
				(prefs) => prefs.duelsPersonalDeckNames,
			),
		)
			.pipe(
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
				map(([runs, [duelsPersonalAdditionalDecks, duelsPersonalDeckNames]]) =>
					this.buildPersonalDeckStats(runs, duelsPersonalAdditionalDecks, duelsPersonalDeckNames),
				),
			)
			.subscribe(this.duelsDecks$);
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
				const deckDefinition = decode(firstMatch.initialDeckList);
				const updatedDeckDefinition = sanitizeDeckstring(deckDefinition, this.allCards);
				const sanitizedDeckstring = encode(updatedDeckDefinition);
				return {
					...mainStats,
					initialDeckList: sanitizedDeckstring,
					heroCardId: heroCardId,
					playerClass: playerClass,
					deckStatsForTypes: decksForTypes,
					// FIXME: use prefs in component to override deck name
					deckName: this.getDeckName(sanitizedDeckstring, duelsPersonalDeckNames) ?? defaultDeckName,
					runs: groupedByDecklist[deckstring],
					debug1: deckDefinition,
					debug2: updatedDeckDefinition,
				} as any as DuelsDeckSummary;
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
			const deckDefinition = decode(firstMatch?.playerDecklist);
			const updatedDeckDefinition = sanitizeDeckstring(deckDefinition, this.allCards);
			normalizedDeckstring = encode(updatedDeckDefinition);
		}
		return DuelsRun.create({
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
			return [null, null];
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
		return steps.find((step) => step.bundleType === 'hero-power')?.option1;
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
