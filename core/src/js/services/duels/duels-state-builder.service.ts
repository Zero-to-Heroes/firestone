/* eslint-disable @typescript-eslint/no-use-before-define */
import { EventEmitter, Injectable } from '@angular/core';
import {
	DeckStat,
	DuelsGlobalStats,
	DuelsGlobalStatsForGameMode,
	DuelsGlobalStatsForPeriod,
	HeroPowerStat,
	HeroStat,
	SignatureTreasureStat,
	TreasureStat,
} from '@firestone-hs/duels-global-stats/dist/stat';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { Input } from '@firestone-hs/retrieve-users-duels-runs/dist/input';
import { DeckDefinition, decode } from 'deckstrings';
import { DuelsGroupedDecks } from '../../models/duels/duels-grouped-decks';
import {
	DuelsDeckStatInfo,
	DuelsDeckSummary,
	DuelsDeckSummaryForType,
	HeroPowerDuelsDeckStatInfo,
	LootDuelsDeckStatInfo,
	SignatureTreasureDuelsDeckStatInfo,
	TreasureDuelsDeckStatInfo,
} from '../../models/duels/duels-personal-deck';
import {
	DuelsDeckStat,
	DuelsHeroPlayerStat,
	DuelsPlayerStats,
	DuelsTreasureStat,
	DuelsTreasureStatForClass,
} from '../../models/duels/duels-player-stats';
import { DuelsRun } from '../../models/duels/duels-run';
import { DuelsState } from '../../models/duels/duels-state';
import { BinderState } from '../../models/mainwindow/binder-state';
import { DuelsCategory } from '../../models/mainwindow/duels/duels-category';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { GameStats } from '../../models/mainwindow/stats/game-stats';
import { PatchInfo } from '../../models/patches';
import { Preferences } from '../../models/preferences';
import { ApiRunner } from '../api-runner';
import { Events } from '../events.service';
import { formatClass } from '../hs-utils';
import { DuelsTopDeckRunDetailsLoadedEvent } from '../mainwindow/store/events/duels/duels-top-deck-run-details-loaded-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { groupByFunction, sumOnArray } from '../utils';
import { getDuelsHeroCardId } from './duels-utils';

const DUELS_RUN_INFO_URL = 'https://p6r07hp5jf.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';
const DUELS_GLOBAL_STATS_URL = 'https://static.zerotoheroes.com/api/duels-global-stats.gz.json?v=15';
const DUELS_RUN_DETAILS_URL = 'https://static-api.firestoneapp.com/retrieveDuelsSingleRun/';

@Injectable()
export class DuelsStateBuilderService {
	public static STATS_THRESHOLD = 100;

	private mainWindowStateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly allCards: AllCardsService,
		private readonly events: Events,
	) {
		this.events
			.on(Events.DUELS_LOAD_TOP_DECK_RUN_DETAILS)
			.subscribe((data) => this.loadTopDeckRunDetails(data.data[0], data.data[1]));

		setTimeout(() => {
			this.mainWindowStateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	private async loadTopDeckRunDetails(runId: string, deckId: number) {
		const results: any = await this.api.callGetApi(`${DUELS_RUN_DETAILS_URL}/${runId}?v=3`);
		// console.log('[duels-state-builder] laoded run details', results);
		const steps: readonly (GameStat | DuelsRunInfo)[] = results?.results;
		this.mainWindowStateUpdater.next(
			new DuelsTopDeckRunDetailsLoadedEvent({
				id: deckId,
				runId: runId,
				steps: steps,
			} as DuelsDeckStat),
		);
	}

	public async loadRuns(): Promise<[readonly DuelsRunInfo[], readonly DuelsRewardsInfo[]]> {
		const user = await this.ow.getCurrentUser();
		const input: Input = {
			userId: user.userId,
			userName: user.username,
		};
		const results: any = await this.api.callPostApi(DUELS_RUN_INFO_URL, input);
		const stepResults: readonly DuelsRunInfo[] =
			results?.results.map(
				(info) =>
					({
						...info,
						option1Contents: info.option1Contents?.split(','),
						option2Contents: info.option2Contents?.split(','),
						option3Contents: info.option3Contents?.split(','),
					} as DuelsRunInfo),
			) || [];
		const rewardsResults: readonly DuelsRewardsInfo[] = results?.rewardsResults || [];
		console.log('[duels-state-builder] loaded result');
		return [stepResults, rewardsResults];
	}

	public async loadGlobalStats(): Promise<DuelsGlobalStats> {
		const result: DuelsGlobalStats = await this.api.callGetApi(DUELS_GLOBAL_STATS_URL);
		console.log('[duels-state-builder] loaded global stats', result);
		return result;
	}

	public initState(
		globalStats: DuelsGlobalStats,
		duelsRunInfo: readonly DuelsRunInfo[],
		duelsRewardsInfo: readonly DuelsRewardsInfo[],
	): DuelsState {
		const categories: readonly DuelsCategory[] = this.buildCategories();
		return DuelsState.create({
			categories: categories,
			globalStats: globalStats,
			duelsRunInfos: duelsRunInfo,
			duelsRewardsInfo: duelsRewardsInfo,
		} as DuelsState);
	}

	private buildCategories(): readonly DuelsCategory[] {
		return [
			DuelsCategory.create({
				id: 'duels-runs',
				name: 'My Runs',
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-personal-decks',
				name: 'My Decks',
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
			DuelsCategory.create({
				id: 'duels-top-decks',
				name: 'High-wins decks',
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
		];
	}

	public async updateState(
		currentState: DuelsState,
		matchStats: GameStats,
		collectionState: BinderState,
		currentDuelsMetaPatch?: PatchInfo,
	): Promise<DuelsState> {
		const prefs = await this.prefs.getPreferences();
		const duelMatches = matchStats?.stats
			?.filter((match) => match.gameMode === 'duels' || match.gameMode === 'paid-duels')
			.filter((match) => match.runId);
		const groupByRunId = groupByFunction((match: GameStat) => match.runId);
		const matchesByRun = groupByRunId(duelMatches);
		const runIds = Object.keys(matchesByRun);
		const runs: readonly DuelsRun[] = runIds
			.map((runId) =>
				this.buildRun(
					runId,
					matchesByRun[runId],
					currentState.duelsRunInfos.filter((runInfo) => runInfo.runId === runId),
					currentState.duelsRewardsInfo.filter((runInfo) => runInfo.runId === runId),
				),
			)
			.filter((run) => run)
			.filter((run) => this.isCorrectGameMode(run, prefs))
			.filter((run) => this.isCorrectPlayerClass(run, prefs))
			.filter((run) =>
				this.isCorrectTime(run, prefs, currentDuelsMetaPatch ?? currentState.currentDuelsMetaPatch),
			)
			.sort(this.getSortFunction());
		console.log('[duels-state-builder] built runs', runs?.length);

		const playerStats = this.buildStatsWithPlayer(runs, currentState.globalStats, collectionState, prefs);
		console.log('[duels-state-builder] playerStats');
		return currentState.update({
			runs: runs,
			playerStats: playerStats,
			loading: false,
			activeHeroSortFilter: prefs.duelsActiveHeroSortFilter,
			activeStatTypeFilter: prefs.duelsActiveStatTypeFilter,
			activeTreasureSortFilter: prefs.duelsActiveTreasureSortFilter,
			activeTreasureStatTypeFilter: prefs.duelsActiveTreasureStatTypeFilter,
			activeTimeFilter: prefs.duelsActiveTimeFilter,
			activeGameModeFilter: prefs.duelsActiveGameModeFilter,
			activeTopDecksClassFilter: prefs.duelsActiveTopDecksClassFilter,
			activeTopDecksDustFilter: prefs.duelsActiveTopDecksDustFilter,
			currentDuelsMetaPatch: currentDuelsMetaPatch ?? currentState.currentDuelsMetaPatch,
		} as DuelsState);
	}

	private buildStatsWithPlayer(
		runs: readonly DuelsRun[],
		globalStats: DuelsGlobalStats,
		collectionState: BinderState,
		prefs: Preferences,
	): DuelsPlayerStats {
		if (!globalStats) {
			return null;
		}
		// const totalMatches = runs.map(run => run.wins + run.losses).reduce((a, b) => a + b, 0);
		// Fallback until everything is properly deployed
		const gameModeStats = globalStats.paidDuels; // this.getGameModeStats(globalStats, prefs) || globalStats.both;
		const periodStats = this.getPeriodStats(gameModeStats, prefs);
		// console.debug('periodStats', prefs.duelsActiveTimeFilter, periodStats);
		if (!periodStats) {
			console.error(
				'[duels-state-builder] could not build period stats',
				prefs.duelsActiveTimeFilter,
				gameModeStats,
				gameModeStats.statsForFullPeriod,
				gameModeStats.statsSinceLastPatch,
			);
			return null;
		}
		const heroStats: readonly DuelsHeroPlayerStat[] = this.buildStats(
			runs,
			periodStats.heroStats,
			(run: DuelsRun) => run.heroCardId,
			(stat: HeroStat) => stat.heroCardId,
			prefs,
		);
		const heroPowerStats: readonly DuelsHeroPlayerStat[] = this.buildStats(
			runs,
			periodStats.heroPowerStats,
			(run: DuelsRun) => run.heroPowerCardId,
			(stat: HeroPowerStat) => stat.heroPowerCardId,
			prefs,
		);
		const signatureTreasureStats: readonly DuelsHeroPlayerStat[] = this.buildStats(
			runs,
			periodStats.signatureTreasureStats,
			(run: DuelsRun) => run.signatureTreasureCardId,
			(stat: SignatureTreasureStat) => stat.signatureTreasureCardId,
			prefs,
		);
		// console.debug(
		// 	'built signature treasures stats',
		// 	signatureTreasureStats,
		// 	periodStats.signatureTreasureStats,
		// 	globalStats,
		// );
		const treasureStats: readonly DuelsTreasureStat[] = this.buildTreasureStats(
			runs,
			periodStats.treasureStats,
			prefs,
		);
		const topDeckStats: readonly DuelsGroupedDecks[] = this.buildTopDeckStats(
			runs,
			periodStats.deckStats,
			collectionState,
			prefs,
		);
		const personalDeckStats: readonly DuelsDeckSummary[] = this.buildPersonalDeckStats(runs, prefs);
		console.log('[duels-state-builder] built duels stats');
		return {
			heroStats: heroStats,
			heroPowerStats: heroPowerStats,
			signatureTreasureStats: signatureTreasureStats,
			treasureStats: treasureStats,
			deckStats: topDeckStats,
			personalDeckStats: personalDeckStats,
		} as DuelsPlayerStats;
	}

	// private getGameModeStats(globalStats: DuelsGlobalStats, prefs: Preferences): DuelsGlobalStatsForGameMode {
	// 	switch (prefs.duelsActiveGameModeFilter) {
	// 		case 'duels':
	// 			return globalStats.duels;
	// 		case 'paid-duels':
	// 			return globalStats.paidDuels;
	// 		case 'all':
	// 		default:
	// 			return globalStats.both;
	// 	}
	// }

	private getPeriodStats(stats: DuelsGlobalStatsForGameMode, prefs: Preferences): DuelsGlobalStatsForPeriod {
		switch (prefs.duelsActiveTimeFilter) {
			case 'last-patch':
				return stats.statsSinceLastPatch;
			case 'past-three':
				return stats.statsForThreeDays;
			case 'past-seven':
				return stats.statsForSevenDays;
			case 'all-time':
			default:
				return stats.statsForFullPeriod;
		}
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

	private buildPersonalDeckStats(runs: readonly DuelsRun[], prefs: Preferences): readonly DuelsDeckSummary[] {
		const groupedByDecklist: { [deckstring: string]: readonly DuelsRun[] } = groupByFunction(
			(run: DuelsRun) => run.initialDeckList,
		)(runs.filter((run) => run.initialDeckList));
		const decks: readonly DuelsDeckSummary[] = Object.keys(groupedByDecklist)
			.filter((deckstring) => deckstring)
			.map((deckstring) => {
				// console.log('[debug] building deck', deckstring, '' + deckstring, deckstring == null);
				const groupedByType: { [deckstring: string]: readonly DuelsRun[] } = groupByFunction(
					(run: DuelsRun) => run.type,
				)(groupedByDecklist[deckstring]);

				const decksForTypes: readonly DuelsDeckSummaryForType[] = Object.keys(groupedByType).map((type) => {
					return {
						type: type,
						...this.buildMainPersonalDecktats(groupedByType[type]),
					} as DuelsDeckSummaryForType;
				});
				const heroCardId = groupedByDecklist[deckstring][0].heroCardId;

				const runsForGameMode = groupedByDecklist[deckstring].filter((run) =>
					this.isCorrectGameMode(run, prefs),
				);
				const mainStats = this.buildMainPersonalDecktats(runsForGameMode);
				const playerClass = this.allCards.getCard(heroCardId)?.playerClass?.toLowerCase();
				const deckName =
					prefs.duelsPersonalDeckNames[deckstring] ||
					`${mainStats.global.averageWinsPerRun.toFixed(1)} wins ${formatClass(playerClass)}`;

				return {
					initialDeckList: deckstring,
					heroCardId: heroCardId,
					playerClass: playerClass,
					...mainStats,
					deckStatsForTypes: decksForTypes,
					deckName: deckName,
					runs: groupedByDecklist[deckstring],
					hidden: prefs.duelsPersonalDeckHiddenDeckCodes.includes(deckstring),
				} as DuelsDeckSummary;
			})
			.filter(
				(stat) =>
					prefs.duelsPersonalDeckShowHiddenDecks ||
					!prefs.duelsPersonalDeckHiddenDeckCodes.includes(stat.initialDeckList),
			);
		console.log('[duels-state-builder] decks', decks?.length);
		return decks;
	}

	private isCorrectGameMode(run: DuelsRun, prefs: Preferences): boolean {
		switch (prefs.duelsActiveGameModeFilter) {
			case 'duels':
				return run.type === 'duels';
			case 'paid-duels':
				return run.type === 'paid-duels';
			case 'all':
			default:
				return true;
		}
	}

	private isCorrectPlayerClass(run: DuelsRun, prefs: Preferences): boolean {
		switch (prefs.duelsActiveTopDecksClassFilter) {
			case 'all':
				return true;
			default:
				return (
					this.allCards.getCard(run.heroCardId)?.playerClass?.toLowerCase() ===
					prefs.duelsActiveTopDecksClassFilter
				);
		}
	}

	private isCorrectTime(run: DuelsRun, prefs: Preferences, patch: PatchInfo): boolean {
		if (prefs.duelsActiveTimeFilter === 'all-time') {
			// console.log('returngin tryue', prefs.duelsActiveTimeFilter);
			return true;
		}
		if (!run.steps || run.steps.filter((step) => (step as GameStat).buildNumber).length === 0) {
			// console.log('no matchg stat', run.steps, prefs.duelsActiveTimeFilter);
			return false;
		}
		const firstMatch = run.steps
			.filter((step) => (step as GameStat).buildNumber)
			.map((step) => step as GameStat)[0];
		const firstMatchTimestamp = firstMatch.creationTimestamp;
		// console.log(
		// 	'checking all filters',
		// 	prefs.duelsActiveTimeFilter,
		// 	firstMatch.buildNumber >= patch.number,
		// 	Date.now() - firstMatchTimestamp < 3 * 24 * 60 * 60 * 1000,
		// 	Date.now() - firstMatchTimestamp < 7 * 24 * 60 * 60 * 1000,
		// 	Date.now(),
		// 	firstMatchTimestamp,
		// );
		switch (prefs.duelsActiveTimeFilter) {
			case 'last-patch':
				return firstMatch.buildNumber >= patch.number;
			case 'past-three':
				return Date.now() - firstMatchTimestamp < 3 * 24 * 60 * 60 * 1000;
			case 'past-seven':
				return Date.now() - firstMatchTimestamp < 7 * 24 * 60 * 60 * 1000;
			default:
				// console.log('returning defualt');
				return true;
		}
	}

	private buildMainPersonalDecktats(
		runs: readonly DuelsRun[],
	): {
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

	private buildTopDeckStats(
		runs: readonly DuelsRun[],
		deckStats: readonly DeckStat[],
		collectionState: BinderState,
		prefs: Preferences,
	): readonly DuelsGroupedDecks[] {
		const decks = deckStats
			.map((stat) => {
				const deck = decode(stat.decklist);
				const dustCost = this.buildDustCost(deck, collectionState);
				return {
					...stat,
					heroCardId: stat.heroCardId || getDuelsHeroCardId(stat.playerClass),
					dustCost: dustCost,
				} as DuelsDeckStat;
			})
			.filter((stat) => this.filterTopDeck(stat, prefs))
			.sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
		console.log('[duels-state-builder] decks', decks?.length);
		const groupedDecks: readonly DuelsGroupedDecks[] = [...this.groupDecks(decks, prefs)];
		return groupedDecks;
	}

	private filterTopDeck(stat: DuelsDeckStat, prefs: Preferences): boolean {
		return this.playerClassFilter(stat, prefs) && this.topDeckDustFilter(stat, prefs);
	}

	private playerClassFilter(stat: DuelsDeckStat | TreasureStat, prefs: Preferences): boolean {
		switch (prefs.duelsActiveTopDecksClassFilter) {
			case 'all':
				return true;
			default:
				return stat.playerClass?.toLowerCase() === prefs.duelsActiveTopDecksClassFilter;
		}
	}

	private topDeckDustFilter(stat: DuelsDeckStat, prefs: Preferences): boolean {
		switch (prefs.duelsActiveTopDecksDustFilter) {
			case 'all':
				return true;
			default:
				return stat.dustCost <= parseInt(prefs.duelsActiveTopDecksDustFilter);
		}
	}

	private groupDecks(decks: readonly DuelsDeckStat[], prefs: Preferences): readonly DuelsGroupedDecks[] {
		const groupingFunction = (deck: DuelsDeckStat) => {
			const date = new Date(deck.periodStart);
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			});
		};
		const groupByDate = groupByFunction(groupingFunction);
		const decksByDate = groupByDate(decks);
		return Object.keys(decksByDate).map((date) => this.buildGroupedDecks(date, decksByDate[date]));
	}

	private buildGroupedDecks(date: string, decks: readonly DuelsDeckStat[]): DuelsGroupedDecks {
		return DuelsGroupedDecks.create({
			header: date,
			decks: decks,
		} as DuelsGroupedDecks);
	}

	private buildDustCost(deck: DeckDefinition, collectionState: BinderState): number {
		return deck.cards
			.map((cards) => cards[0])
			.map((cardDbfId) => this.allCards.getCardFromDbfId(+cardDbfId))
			.filter((card) => card)
			.map((card) => {
				const out = collectionState.getCard(card.id);
				if (!out) {
					console.warn('[duels-state-builder] Could not find card for', card.id, deck);
				}
				return out;
				// ?? new SetCard(card.id, card.name, card.playerClass, card.rarity, card.cost, 0, 0, 0);
			})
			.filter((card) => card)
			.filter((card) => card.getNumberCollected() === 0)
			.map((card) => card.getRegularDustCost())
			.reduce((a, b) => a + b, 0);
	}

	private buildTreasureStats(
		runs: readonly DuelsRun[],
		treasureStats: readonly TreasureStat[],
		prefs: Preferences,
	): readonly DuelsTreasureStat[] {
		const treasuresForClass = treasureStats.filter((stat) => this.playerClassFilter(stat, prefs));
		// console.log('[debug] filtering treasures', treasureStats, prefs, treasuresForClass);
		const groupedByTreasures = groupByFunction((stat: TreasureStat) => stat.cardId)(treasuresForClass);
		const treasureIds = Object.keys(groupedByTreasures);
		const totalTreasureOfferings = treasuresForClass.map((stat) => stat.totalOffered).reduce((a, b) => a + b, 0);
		return (
			treasureIds
				.map((treasureId) => {
					const statsForTreasure: readonly TreasureStat[] = groupedByTreasures[treasureId];
					return this.buildTreasureStat(treasureId, statsForTreasure, runs, totalTreasureOfferings);
				})
				// For now I want to keep the "rare" passives, since they have been confirmed
				// .filter(stat => stat.globalWinrate)
				// .filter(stat => stat.globalTotalMatches > 0)
				.sort(this.getTreasureSortFunction(prefs))
		);
	}

	private buildTreasureStat(
		treasureId: string,
		statsForTreasure: readonly TreasureStat[],
		runs: readonly DuelsRun[],
		totalTreasureOfferings: number,
	): DuelsTreasureStat {
		const groupedByClass = groupByFunction((stat: TreasureStat) => stat.playerClass)(statsForTreasure);
		const totalTreasureOfferingsForTreasure = statsForTreasure
			.map((stat) => stat.totalOffered)
			.reduce((a, b) => a + b, 0);
		const statsForClass: readonly DuelsTreasureStatForClass[] = Object.keys(groupedByClass).map((playerClass) => {
			const classStats: readonly TreasureStat[] = groupedByClass[playerClass];
			return this.buildTreasureForClass(treasureId, playerClass, classStats, totalTreasureOfferingsForTreasure);
		});
		const globalTotalOffered = statsForClass.map((stat) => stat.globalTotalOffered).reduce((a, b) => a + b, 0);
		const globalTotalPicked = statsForClass.map((stat) => stat.globalTotalPicked).reduce((a, b) => a + b, 0);
		const globalTotalMatches = statsForClass.map((stat) => stat.globalTotalMatches).reduce((a, b) => a + b, 0);
		const globalTotalWins = statsForClass.map((stat) => stat.globalTotalWins).reduce((a, b) => a + b, 0);
		const globalTotalLosses = statsForClass.map((stat) => stat.globalTotalLosses).reduce((a, b) => a + b, 0);
		const globalTotalTies = statsForClass.map((stat) => stat.globalTotalTies).reduce((a, b) => a + b, 0);

		const treasureOfferings = runs
			.map((run) => run.steps)
			.reduce((a, b) => a.concat(b), [])
			.filter((step) => (step as DuelsRunInfo).bundleType === 'treasure')
			.map((step) => step as DuelsRunInfo)
			.filter(
				(step) => step.option1 === treasureId || step.option2 === treasureId || step.option3 === treasureId,
			);
		const playerPickRate =
			treasureOfferings.length === 0
				? null
				: (100 *
						treasureOfferings.filter(
							(step) =>
								(step.chosenOptionIndex === 1 && step.option1 === treasureId) ||
								(step.chosenOptionIndex === 2 && step.option2 === treasureId) ||
								(step.chosenOptionIndex === 3 && step.option3 === treasureId),
						).length) /
				  treasureOfferings.length;
		const result = {
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
		return result;
	}

	private buildTreasureForClass(
		treasureId: string,
		playerClass: string,
		classStats: readonly TreasureStat[],
		totalTreasureOfferingsForTreasure: number,
	): DuelsTreasureStatForClass {
		const globalTotalOffered = classStats.map((stat) => stat.totalOffered).reduce((a, b) => a + b, 0);
		const globalTotalPicked = classStats.map((stat) => stat.totalPicked).reduce((a, b) => a + b, 0);
		const globalTotalMatches = classStats.map((stat) => stat.matchesPlayed).reduce((a, b) => a + b, 0);
		const globalTotalWins = classStats.map((stat) => stat.totalWins).reduce((a, b) => a + b, 0);
		const globalTotalLosses = classStats.map((stat) => stat.totalLosses).reduce((a, b) => a + b, 0);
		const globalTotalTies = classStats.map((stat) => stat.totalTies).reduce((a, b) => a + b, 0);

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
		runIdExtractor: (run: DuelsRun) => string,
		idExtractor: (stat: HeroStat | HeroPowerStat | SignatureTreasureStat) => string,
		prefs: Preferences,
	): readonly DuelsHeroPlayerStat[] {
		const totalMatchesForPlayer = runs.map((run) => run.wins + run.losses).reduce((a, b) => a + b, 0);
		const totalStats = stats.map((stat) => stat.totalMatches).reduce((a, b) => a + b, 0);

		const allStats = stats
			.filter(
				(stat) =>
					prefs.duelsActiveTopDecksClassFilter === 'all' ||
					prefs.duelsActiveTopDecksClassFilter === stat.heroClass.toLowerCase(),
			)
			.filter(
				(stat) =>
					!prefs.duelsHideStatsBelowThreshold || stat.totalMatches > DuelsStateBuilderService.STATS_THRESHOLD,
			)
			.map((stat) => {
				const playerTotalMatches = runs
					.filter((run) => runIdExtractor(run) === idExtractor(stat))
					.map((run) => run.wins + run.losses)
					.reduce((a, b) => a + b, 0);
				return {
					cardId: idExtractor(stat),
					heroClass: stat.heroClass,
					periodStart: stat.periodStart,
					globalTotalMatches: stat.totalMatches,
					globalPopularity: totalStats === 0 ? 0 : (100 * stat.totalMatches) / totalStats,
					globalWinrate: stat.totalMatches === 0 ? 0 : (100 * stat.totalWins) / stat.totalMatches,
					globalWinDistribution: this.buildWinDistribution((stat as HeroStat).winDistribution),
					playerTotalMatches: playerTotalMatches,
					playerPopularity:
						totalMatchesForPlayer === 0 ? 0 : (100 * playerTotalMatches) / totalMatchesForPlayer,
					playerWinrate:
						playerTotalMatches === 0
							? 0
							: (100 *
									runs
										.filter((run) => runIdExtractor(run) === idExtractor(stat))
										.map((run) => run.wins)
										.reduce((a, b) => a + b, 0)) /
							  playerTotalMatches,
				} as DuelsHeroPlayerStat;
			})
			.filter((stat) => stat.globalTotalMatches > 10)
			.sort(this.getStatSortFunction(prefs));

		const grouped = groupByFunction((stat: DuelsHeroPlayerStat) => stat.cardId)(allStats);
		// TODO: group by cardId, because of signature treasures
		return Object.values(grouped).map((stats: readonly DuelsHeroPlayerStat[]) => {
			const refStat = stats[0];
			const totalMatches = sumOnArray(stats, (stat) => stat.globalTotalMatches);
			const playerTotalMatches = sumOnArray(stats, (stat) => stat.playerTotalMatches);
			return {
				cardId: refStat.cardId,
				heroClass: refStat.heroClass,
				periodStart: refStat.periodStart,
				globalTotalMatches: totalMatches,
				globalPopularity: sumOnArray(stats, (stat) => stat.globalPopularity),
				globalWinrate:
					totalMatches === 0
						? 0
						: sumOnArray(stats, (stat) => stat.globalWinrate * stat.globalTotalMatches) / totalMatches,
				globalWinDistribution: this.mergeWinDistributions(...stats.map((stat) => stat.globalWinDistribution)),
				playerTotalMatches: playerTotalMatches,
				playerPopularity: totalMatchesForPlayer === 0 ? 0 : playerTotalMatches / totalMatchesForPlayer,
				playerWinrate:
					playerTotalMatches === 0
						? 0
						: (100 *
								runs
									.filter((run) => runIdExtractor(run) === refStat.cardId)
									.map((run) => run.wins)
									.reduce((a, b) => a + b, 0)) /
						  playerTotalMatches,
			};
		});
	}

	private buildWinDistribution(winDistribution: {
		[winNumber: string]: number;
	}): readonly { winNumber: number; value: number }[] {
		if (!winDistribution) {
			return [];
		}
		const total = Object.values(winDistribution).reduce((a, b) => a + b, 0);
		return Object.keys(winDistribution)
			.sort((a, b) => +a - +b)
			.map((winNumber) => ({
				winNumber: +winNumber,
				value: winDistribution[winNumber] / total,
			}));
	}

	private mergeWinDistributions(
		...winDistributions: (readonly { winNumber: number; value: number }[])[]
	): readonly { winNumber: number; value: number }[] {
		const totalGames: number = sumOnArray(winDistributions, (dists) => sumOnArray(dists, (dist) => dist.value));
		const wins = [
			...new Set(
				winDistributions.map((dists) => dists.map((dist) => dist.winNumber)).reduce((a, b) => a.concat(b), []),
			),
		].sort((a, b) => a - b);
		return wins.map((winNumber) => ({
			winNumber: +winNumber,
			value:
				(100 *
					sumOnArray(winDistributions, (dists) => dists.find((dist) => dist.winNumber === winNumber).value)) /
				totalGames,
		}));
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
				return (a, b) =>
					a.globalOfferingRate == null
						? 1
						: b.globalOfferingRate == null
						? -1
						: b.globalOfferingRate - a.globalOfferingRate;
			case 'player-pickrate':
				return (a, b) =>
					a.playerPickRate == null ? 1 : b.playerPickRate == null ? -1 : b.playerPickRate - a.playerPickRate;
			case 'global-pickrate':
				return (a, b) =>
					a.globalPickRate == null ? 1 : b.globalPickRate == null ? -1 : b.globalPickRate - a.globalPickRate;
			case 'global-winrate':
			default:
				return (a, b) =>
					a.globalWinrate == null ? 1 : b.globalWinrate == null ? -1 : b.globalWinrate - a.globalWinrate;
		}
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
			initialDeckList: firstMatch?.playerDecklist,
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
		const [wins, losses] = lastMatch.additionalResult.split('-').map((info) => parseInt(info));
		// console.log('wins, losses', wins, losses, lastMatch.additionalResult.split('-'), lastMatch);
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

	private getSortFunction(): (a: DuelsRun, b: DuelsRun) => number {
		return (a: DuelsRun, b: DuelsRun) => {
			if (a.creationTimestamp <= b.creationTimestamp) {
				return 1;
			}
			return -1;
		};
	}
}
