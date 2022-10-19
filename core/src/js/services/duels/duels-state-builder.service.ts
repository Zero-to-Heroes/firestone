/* eslint-disable @typescript-eslint/no-use-before-define */
import { EventEmitter, Injectable } from '@angular/core';
import { DeckDefinition, decode } from '@firestone-hs/deckstrings';
import { DeckStat, DuelsStat, DuelsStatDecks } from '@firestone-hs/duels-global-stats/dist/stat';
import { DuelsLeaderboard } from '@firestone-hs/duels-leaderboard';
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { DuelsRewardsInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-rewards-info';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { Input } from '@firestone-hs/retrieve-users-duels-runs/dist/input';
import { DuelsConfig } from '@models/duels/duels-config';
import { AdventuresInfo, DuelsInfo } from '@models/memory/memory-duels';
import { MemoryUpdate } from '@models/memory/memory-update';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DuelsMemoryCacheService } from '@services/duels/duels-memory-cache.service';
import { DuelsChoosingHeroEvent } from '@services/mainwindow/store/events/duels/duels-choosing-hero-event';
import { DuelsCurrentDeckEvent } from '@services/mainwindow/store/events/duels/duels-current-deck-event';
import { DuelsCurrentOptionEvent } from '@services/mainwindow/store/events/duels/duels-current-option-event';
import { DuelsIsOnDeckBuildingLobbyScreenEvent } from '@services/mainwindow/store/events/duels/duels-is-on-deck-building-lobby-screen-event';
import { DuelsIsOnMainScreenEvent } from '@services/mainwindow/store/events/duels/duels-is-on-main-screen-event';
import { DuelsStateUpdatedEvent } from '@services/mainwindow/store/events/duels/duels-state-updated-event';
import { MemoryInspectionService } from '@services/plugins/memory-inspection.service';
import { BehaviorSubject } from 'rxjs';
import { DuelsGroupedDecks } from '../../models/duels/duels-grouped-decks';
import { DuelsDeckStatInfo } from '../../models/duels/duels-personal-deck';
import { DuelsDeckStat } from '../../models/duels/duels-player-stats';
import { DuelsRun } from '../../models/duels/duels-run';
import { DuelsBucketsData, DuelsState } from '../../models/duels/duels-state';
import { BinderState } from '../../models/mainwindow/binder-state';
import { DuelsCategory } from '../../models/mainwindow/duels/duels-category';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { PatchInfo } from '../../models/patches';
import { ApiRunner } from '../api-runner';
import { Events } from '../events.service';
import { runLoop } from '../game-mode-data.service';
import { LocalizationFacadeService } from '../localization-facade.service';
import { DuelsTopDeckRunDetailsLoadedEvent } from '../mainwindow/store/events/duels/duels-top-deck-run-details-loaded-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';
import { groupByFunction } from '../utils';

const DUELS_RUN_INFO_URL = 'https://p6r07hp5jf.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';
// const DUELS_GLOBAL_STATS_URL = 'https://static.zerotoheroes.com/api/duels-global-stats-hero-class.gz.json';
const DUELS_GLOBAL_STATS_URL_SPLIT =
	'https://static.zerotoheroes.com/api/duels/duels-global-stats-hero-class-%mmr%-%date%.gz.json';
const DUELS_GLOBAL_STATS_DECKS =
	'https://static.zerotoheroes.com/api/duels/duels-global-stats-hero-class-decks.gz.json';
const DUELS_RUN_DETAILS_URL = 'https://static-api.firestoneapp.com/retrieveDuelsSingleRun/';
const DUELS_LEADERBOARD_URL = 'https://api.firestoneapp.com/duelsLeaderboard/get/duelsLeaderboard/{proxy+}';
const DUELS_CONFIG_URL = 'https://static.zerotoheroes.com/hearthstone/data/duels-config.json';
const DUELS_BUCKETS_URL = 'https://static.zerotoheroes.com/api/duels/duels-buckets.gz.json';

@Injectable()
export class DuelsStateBuilderService {
	public static STATS_THRESHOLD = 40;

	public isOnMainScreen = new BehaviorSubject<boolean>(false);
	public duelsInfo$$ = new BehaviorSubject<DuelsInfo>(null);

	private mainWindowStateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly allCards: CardsFacadeService,
		private readonly events: Events,
		private readonly i18n: LocalizationFacadeService,
		private readonly memory: MemoryInspectionService,
		private readonly duelsMemoryCeche: DuelsMemoryCacheService,
	) {
		this.init();
	}

	private async init() {
		this.initDuelsInfoObservable();

		this.events
			.on(Events.DUELS_LOAD_TOP_DECK_RUN_DETAILS)
			.subscribe((data) => this.loadTopDeckRunDetails(data.data[0], data.data[1]));

		this.events.on(Events.MEMORY_UPDATE).subscribe(async (data) => {
			const changes: MemoryUpdate = data.data[0];
			// null simply means "no change"
			if (changes.IsDuelsMainRunScreen === true) {
				console.debug('[duels-state-builder] duels main screen');
				this.isOnMainScreen.next(true);
			} else if (changes.IsDuelsMainRunScreen === false) {
				console.debug('[duels-state-builder] duels not main screen');
				this.isOnMainScreen.next(false);
			}

			if (changes.IsDuelsDeckBuildingLobbyScreen != null) {
				this.mainWindowStateUpdater.next(
					new DuelsIsOnDeckBuildingLobbyScreenEvent(changes.IsDuelsDeckBuildingLobbyScreen),
				);
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

			this.duelsInfo$$.asObservable().subscribe((deck) => {
				this.mainWindowStateUpdater.next(new DuelsCurrentDeckEvent(deck));
			});
			this.isOnMainScreen.asObservable().subscribe((deck) => {
				this.mainWindowStateUpdater.next(new DuelsIsOnMainScreenEvent(deck));
			});
		});

		this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if ((res.gameChanged || res.runningChanged) && (await this.ow.inGame())) {
				const [updatedAdventuresInfo] = await Promise.all([this.duelsMemoryCeche.getAdventuresInfo()]);
				this.mainWindowStateUpdater.next(new DuelsStateUpdatedEvent(updatedAdventuresInfo));
			}
		});
	}

	public async triggerDuelsMatchInfoRetrieve(waitForRating = true) {
		await runLoop(async () => {
			const duelsInfo = await this.memory.getDuelsInfo();
			if (!!duelsInfo?.Rating) {
				this.duelsInfo$$.next({
					...duelsInfo,
					// Give priority to the cardIds, as this is what we get when reading the duels deck
					// from the main Duels manager, instead of the dungeon run scene
					DeckList: duelsInfo.DeckListWithCardIds ?? duelsInfo.DeckList,
				});
				return true;
			}
			return false;
		}, 'duelsInfo');
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

	public async loadBuckets(): Promise<readonly DuelsBucketsData[]> {
		const result: readonly DuelsBucketsData[] = await this.api.callGetApi(DUELS_BUCKETS_URL);
		console.log('[duels-state-builder] loaded buckets data', result?.length);
		console.debug('[duels-state-builder] loaded buckets data', result);
		return (
			result
				?.map(
					(bucket) =>
						({
							...bucket,
							bucketClasses: bucket.bucketClasses.map(
								(bucketClass) => CardClass[(bucketClass as any) as string],
							),
						} as DuelsBucketsData),
				)
				.filter((bucket) => bucket.bucketId !== CardIds.GroupLearningTavernBrawl) ?? []
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

	public async loadConfig(): Promise<DuelsConfig> {
		const result: DuelsConfig = await this.api.callGetApi(DUELS_CONFIG_URL);
		console.log('[duels-state-builder] loaded duels config');
		return result;
	}

	public initState(
		globalStats: DuelsStat,
		globalStatsDecks: DuelsStatDecks,
		duelsRunInfo: readonly DuelsRunInfo[],
		duelsRewardsInfo: readonly DuelsRewardsInfo[],
		duelsConfig: DuelsConfig,
		leaderboard: DuelsLeaderboard,
		bucketsData: readonly DuelsBucketsData[],
		collectionState: BinderState,
		adventuresInfo: AdventuresInfo,
		currentDuelsMetaPatch?: PatchInfo,
	): DuelsState {
		const categories: readonly DuelsCategory[] = this.buildCategories();
		const topDecks: readonly DuelsGroupedDecks[] = this.buildTopDeckStats(
			globalStatsDecks?.decks ?? [],
			collectionState,
		);
		return DuelsState.create({
			categories: categories,
			globalStats: globalStats,
			config: duelsConfig,
			topDecks: topDecks,
			duelsRunInfos: duelsRunInfo,
			duelsRewardsInfo: duelsRewardsInfo,
			bucketsData: bucketsData,
			leaderboard: leaderboard,
			adventuresInfo: adventuresInfo,
			currentDuelsMetaPatch: currentDuelsMetaPatch,
			loading: false,
		} as DuelsState);
	}

	private async loadTopDeckRunDetails(runId: string, deckId: number) {
		const results: any = await this.api.callGetApi(`${DUELS_RUN_DETAILS_URL}/${runId}`);
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
			DuelsCategory.create({
				id: 'duels-deckbuilder',
				name: this.i18n.translateString('app.duels.menu.deckbuilder'),
				enabled: true,
				icon: undefined,
				categories: null,
			} as DuelsCategory),
			DuelsCategory.create({
				id: 'duels-buckets',
				name: this.i18n.translateString('app.duels.menu.buckets'),
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
				if (!out && !!this.allCards.getCards()?.length) {
					// console.warn('[duels-state-builder] Could not find card for', card.id, deck);
				}
				return out;
				// ?? new SetCard(card.id, card.name, card.playerClass, card.rarity, card.cost, 0, 0, 0);
			})
			.filter((card) => card)
			.filter((card) => card.getNumberCollected() === 0)
			.map((card) => card.getRegularDustCost())
			.reduce((a, b) => a + b, 0);
	}

	private initDuelsInfoObservable() {
		this.events.on(Events.MEMORY_UPDATE).subscribe(async (data) => {
			const changes: MemoryUpdate = data.data[0];
			if (changes.IsDuelsMainRunScreen || (this.isOnMainScreen.value && changes.DuelsCurrentCardsInDeck)) {
				this.updateDuelsInfo();
			}
		});
		this.updateDuelsInfo();
	}

	private async updateDuelsInfo() {
		const duelsInfo = await this.memory.getDuelsInfo();
		console.debug('[duels-state-builder] duels info', duelsInfo);
		if (duelsInfo) {
			this.duelsInfo$$.next({
				...duelsInfo,
				// Give priority to the cardIds, as this is what we get when reading the duels deck
				// from the main Duels manager, instead of the dungeon run scene
				DeckList: duelsInfo.DeckListWithCardIds ?? duelsInfo.DeckList,
			});
		}
	}
}
