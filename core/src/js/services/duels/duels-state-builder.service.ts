/* eslint-disable @typescript-eslint/no-use-before-define */
import { EventEmitter, Injectable } from '@angular/core';
import { DeckStat, DuelsStat, DuelsStatDecks } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsLeaderboard } from '@firestone-hs/duels-leaderboard';
import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { Input } from '@firestone-hs/retrieve-users-duels-runs/dist/input';
import { DeckInfoFromMemory } from '@models/mainwindow/decktracker/deck-info-from-memory';
import { MemoryUpdate } from '@models/memory/memory-update';
import { CardsFacadeService } from '@services/cards-facade.service';
import { getDuelsModeName } from '@services/duels/duels-utils';
import { DuelsChoosingHeroEvent } from '@services/mainwindow/store/events/duels/duels-choosing-hero-event';
import { DuelsCurrentDeckEvent } from '@services/mainwindow/store/events/duels/duels-current-deck-event';
import { DuelsCurrentOptionEvent } from '@services/mainwindow/store/events/duels/duels-current-option-event';
import { DuelsIsOnMainScreenEvent } from '@services/mainwindow/store/events/duels/duels-is-on-main-screen-event';
import { MemoryInspectionService } from '@services/plugins/memory-inspection.service';
import { DeckDefinition, decode } from 'deckstrings';
import { BehaviorSubject } from 'rxjs';
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
import { DuelsDeckStat } from '../../models/duels/duels-player-stats';
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
import { LocalizationFacadeService } from '../localization-facade.service';
import { DuelsTopDeckRunDetailsLoadedEvent } from '../mainwindow/store/events/duels/duels-top-deck-run-details-loaded-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { groupByFunction } from '../utils';

const DUELS_RUN_INFO_URL = 'https://p6r07hp5jf.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';
// const DUELS_GLOBAL_STATS_URL = 'https://static.zerotoheroes.com/api/duels-global-stats-hero-class.gz.json?v=20';
const DUELS_GLOBAL_STATS_URL_SPLIT =
	'https://static.zerotoheroes.com/api/duels/duels-global-stats-hero-class-%mmr%-%date%.gz.json?v=21';
const DUELS_GLOBAL_STATS_DECKS =
	'https://static.zerotoheroes.com/api/duels/duels-global-stats-hero-class-decks.gz.json?v=20';
const DUELS_RUN_DETAILS_URL = 'https://static-api.firestoneapp.com/retrieveDuelsSingleRun/';
const DUELS_LEADERBOARD_URL = 'https://api.firestoneapp.com/duelsLeaderboard/get/duelsLeaderboard/{proxy+}';

@Injectable()
export class DuelsStateBuilderService {
	public static STATS_THRESHOLD = 40;

	public duelsDeck = new BehaviorSubject<DeckInfoFromMemory>(null);
	public isOnMainScreen = new BehaviorSubject<boolean>(false);

	private mainWindowStateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly allCards: CardsFacadeService,
		private readonly events: Events,
		private readonly i18n: LocalizationFacadeService,
		private readonly memory: MemoryInspectionService,
	) {
		this.init();
	}

	private async init() {
		this.events
			.on(Events.DUELS_LOAD_TOP_DECK_RUN_DETAILS)
			.subscribe((data) => this.loadTopDeckRunDetails(data.data[0], data.data[1]));

		this.events.on(Events.MEMORY_UPDATE).subscribe(async (data) => {
			const changes: MemoryUpdate = data.data[0];
			if (changes.IsDuelsMainRunScreen) {
				const duelsInfo = await this.memory.getDuelsInfo();
				console.debug('[duels-state-builder] duels info', duelsInfo);
				this.duelsDeck.next({
					...duelsInfo,
					// Give priority to the cardIds, as this is what we get when reading the duels deck
					// from the main Duels manager, instead of the dungeon run scene
					DeckList: duelsInfo.DeckListWithCardIds ?? duelsInfo.DeckList,
				});
			}
			// null simply means "no change"
			if (changes.IsDuelsMainRunScreen === true) {
				console.debug('[duels-state-builder] duels main screen');
				this.isOnMainScreen.next(true);
			} else if (changes.IsDuelsMainRunScreen === false) {
				console.debug('[duels-state-builder] duels not main screen');
				this.isOnMainScreen.next(false);
			}

			if (changes.DuelsCurrentOptionSelection != null) {
				this.mainWindowStateUpdater.next(new DuelsCurrentOptionEvent(changes.DuelsCurrentOptionSelection));
			}

			if (changes.IsDuelsChoosingHero != null) {
				this.mainWindowStateUpdater.next(new DuelsChoosingHeroEvent(changes.IsDuelsChoosingHero));
			}
		});

		setTimeout(() => {
			this.mainWindowStateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;

			this.duelsDeck.asObservable().subscribe((deck) => {
				this.mainWindowStateUpdater.next(new DuelsCurrentDeckEvent(deck));
			});
			this.isOnMainScreen.asObservable().subscribe((deck) => {
				this.mainWindowStateUpdater.next(new DuelsIsOnMainScreenEvent(deck));
			});
		});

		const duelsInfo = await this.memory.getDuelsInfo();
		if (duelsInfo) {
			this.duelsDeck.next({
				...duelsInfo,
				// Give priority to the cardIds, as this is what we get when reading the duels deck
				// from the main Duels manager, instead of the dungeon run scene
				DeckList: duelsInfo.DeckListWithCardIds ?? duelsInfo.DeckList,
			});
			console.log('[duels-state-builder] initial duels deck', this.duelsDeck?.value?.DeckList?.length);
			console.debug('[duels-state-builder] initial duels deck', this.duelsDeck);
		}
	}

	public async loadLeaderboard(): Promise<DuelsLeaderboard> {
		const user = await this.ow.getCurrentUser();
		const input: Input = {
			userId: user.userId,
			userName: user.username,
		};
		const results: any = await this.api.callPostApi(DUELS_LEADERBOARD_URL, input);
		console.log('[duels-state-builder] loaded leaderboard', results?.results?.heroic?.length);
		return results?.results;
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

	public async loadGlobalStats(): Promise<DuelsStat> {
		const prefs = await this.prefs.getPreferences();
		const mmr = (prefs.duelsActiveMmrFilter as any) === 'all' ? 100 : Math.min(100, prefs.duelsActiveMmrFilter);
		const result: DuelsStat = await this.api.callGetApi(
			DUELS_GLOBAL_STATS_URL_SPLIT.replace('%mmr%', '' + mmr).replace('%date%', prefs.duelsActiveTimeFilter),
		);
		console.log('[duels-state-builder] loaded global stats', result?.treasures?.length);
		console.debug('[duels-state-builder] loaded global stats', result);

		// const temp: DuelsStat = await this.api.callGetApi(DUELS_GLOBAL_STATS_URL);
		// console.debug(
		// 	'[duels-state-builder] old stats',
		// 	temp,
		// 	temp.heroes
		// 		.filter((stat) => stat.mmrPercentile === prefs.duelsActiveMmrFilter)
		// 		.filter((stat) => stat.date === prefs.duelsActiveTimeFilter),
		// );
		return result;
	}

	public async loadTopDecks(): Promise<DuelsStatDecks> {
		const result: DuelsStatDecks = await this.api.callGetApi(DUELS_GLOBAL_STATS_DECKS);
		console.log('[duels-state-builder] loaded global stats deck', result?.decks?.length);
		return result;
	}

	public initState(
		globalStats: DuelsStat,
		globalStatsDecks: DuelsStatDecks,
		duelsRunInfo: readonly DuelsRunInfo[],
		duelsRewardsInfo: readonly DuelsRewardsInfo[],
		leaderboard: DuelsLeaderboard,
		collectionState: BinderState,
	): DuelsState {
		const categories: readonly DuelsCategory[] = this.buildCategories();
		const topDecks: readonly DuelsGroupedDecks[] = this.buildTopDeckStats(
			globalStatsDecks?.decks ?? [],
			collectionState,
		);
		return DuelsState.create({
			categories: categories,
			globalStats: globalStats,
			topDecks: topDecks,
			duelsRunInfos: duelsRunInfo,
			duelsRewardsInfo: duelsRewardsInfo,
			leaderboard: leaderboard,
		} as DuelsState);
	}

	public async updateState(
		currentState: DuelsState,
		matchStats: GameStats,
		currentDuelsMetaPatch?: PatchInfo,
	): Promise<DuelsState> {
		const duelMatches = matchStats?.stats?.filter((match) => match.isDuels()).filter((match) => match.runId);
		const matchesByRun = groupByFunction((match: GameStat) => match.runId)(duelMatches);
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
			.filter((run) => run);
		console.log('[duels-state-builder] built runs', runs?.length);
		const prefs = await this.prefs.getPreferences();
		const personalDeckStats: readonly DuelsDeckSummary[] = this.buildPersonalDeckStats(runs, prefs);
		console.log('[duels-state-builder] built deck stats');
		return currentState.update({
			runs: runs,
			loading: false,
			personalDeckStats: personalDeckStats,
			currentDuelsMetaPatch: currentDuelsMetaPatch ?? currentState.currentDuelsMetaPatch,
		} as DuelsState);
	}

	private async loadTopDeckRunDetails(runId: string, deckId: number) {
		const results: any = await this.api.callGetApi(`${DUELS_RUN_DETAILS_URL}/${runId}?v=3`);
		const steps: readonly (GameStat | DuelsRunInfo)[] = results?.results;
		this.mainWindowStateUpdater.next(
			new DuelsTopDeckRunDetailsLoadedEvent({
				id: deckId,
				runId: runId,
				steps: steps,
			} as DuelsDeckStat),
		);
	}

	private buildCategories(): readonly DuelsCategory[] {
		const result = [
			DuelsCategory.create({
				id: 'duels-runs',
				name: this.i18n.translateString('app.duels.menu.my-runs'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-personal-decks',
				name: this.i18n.translateString('app.duels.menu.my-decks'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-stats',
				name: this.i18n.translateString('app.duels.menu.heroes'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-treasures',
				name: this.i18n.translateString('app.duels.menu.treasures'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-top-decks',
				name: this.i18n.translateString('app.duels.menu.high-win-decks'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-deck-details',
				name: null,
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-personal-deck-details',
				name: null,
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-leaderboard',
				name: this.i18n.translateString('app.duels.menu.leaderboard'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
		];
		return result;
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
				const groupedByType: { [deckstring: string]: readonly DuelsRun[] } = groupByFunction(
					(run: DuelsRun) => run.type,
				)(groupedByDecklist[deckstring]);

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
				return {
					...mainStats,
					initialDeckList: firstMatch.initialDeckList,
					heroCardId: heroCardId,
					playerClass: playerClass,
					deckStatsForTypes: decksForTypes,
					// FIXME: use prefs in component to override deck name
					deckName: this.getDeckName(firstMatch.initialDeckList, prefs) ?? defaultDeckName,
					runs: groupedByDecklist[deckstring],
				} as DuelsDeckSummary;
			});
		console.log('[duels-state-builder] personal decks', decks?.length);
		return decks;
	}

	private getDeckName(initialDeckList: string, prefs: Preferences): string {
		return prefs.duelsPersonalDeckNames[initialDeckList] ?? null;
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
		deckStats: readonly DeckStat[],
		collectionState: BinderState,
	): readonly DuelsGroupedDecks[] {
		const decks = deckStats
			// This should already be filtered out by the API
			.filter((stat) => stat.decklist)
			// Same here
			.slice(0, 1000)
			.map((stat) => {
				const deck = decode(stat.decklist);
				const dustCost = this.buildDustCost(deck, collectionState);
				return {
					...stat,
					heroCardId: stat.heroCardId,
					dustCost: dustCost,
				} as DuelsDeckStat;
			})
			.sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime());
		console.log('[duels-state-builder] top decks', decks?.length);
		const groupedDecks: readonly DuelsGroupedDecks[] = [...this.groupDecks(decks)];
		return groupedDecks;
	}

	private groupDecks(decks: readonly DuelsDeckStat[]): readonly DuelsGroupedDecks[] {
		const groupingFunction = (deck: DuelsDeckStat) => {
			const date = new Date(deck.periodStart);
			return date.toLocaleDateString(this.i18n.formatCurrentLocale(), {
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
			buildNumberAtStart: firstMatch?.buildNumber,
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
