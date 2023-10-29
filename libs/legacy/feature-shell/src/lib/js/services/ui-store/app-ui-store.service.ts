import { EventEmitter, Injectable } from '@angular/core';
import { DuelsHeroStat, DuelsStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { ALL_BG_RACES } from '@firestone-hs/reference-data';
import { BgsMetaHeroStatTierItem, buildHeroStats, enhanceHeroStat } from '@firestone/battlegrounds/data-access';
import { filterDuelsHeroStats } from '@firestone/duels/data-access';
import { PrefsSelector, Store, SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { ModsConfig } from '@legacy-import/src/lib/libs/mods/model/mods-config';
import { MailState } from '@mails/mail-state';
import { MailsService } from '@mails/services/mails.service';
import { DuelsHeroPlayerStat } from '@models/duels/duels-player-stats';
import { DuelsRun } from '@models/duels/duels-run';
import { buildDuelsHeroPlayerStats, filterDuelsRuns } from '@services/ui-store/duels-ui-helper';

import { DuelsStatTypeFilterType } from '@firestone/duels/data-access';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, shareReplay, tap } from 'rxjs/operators';

import { ProfileBgHeroStat, ProfileClassProgress } from '@firestone-hs/api-user-profile';
import { BgsQuestStats } from '@firestone-hs/bgs-global-stats';
import { ArchetypeStat, ArchetypeStats, DeckStat, DeckStats } from '@firestone-hs/constructed-deck-stats';
import { DuelsLeaderboard } from '@firestone-hs/duels-leaderboard';
import { PackResult } from '@firestone-hs/user-packs';
import { PackInfo } from '@firestone/collection/view';
import { TavernBrawlService } from '../../../libs/tavern-brawl/services/tavern-brawl.service';
import { TavernBrawlState } from '../../../libs/tavern-brawl/tavern-brawl-state';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { CardHistory } from '../../models/card-history';
import { Coin } from '../../models/coin';
import { GameState } from '../../models/decktracker/game-state';
import { DuelsDeckSummary } from '../../models/duels/duels-personal-deck';
import { DuelsBucketsData } from '../../models/duels/duels-state';
import { BattlegroundsAppState } from '../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { DeckSummary } from '../../models/mainwindow/decktracker/deck-summary';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { AdventuresInfo } from '../../models/memory/memory-duels';
import { MercenariesBattleState } from '../../models/mercenaries/mercenaries-battle-state';
import { MercenariesOutOfCombatState } from '../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { Preferences } from '../../models/preferences';
import { Set } from '../../models/set';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';
import { AchievementHistoryService } from '../achievement/achievements-history.service';
import {
	AchievementsLiveProgressTrackingService,
	AchievementsProgressTracking,
} from '../achievement/achievements-live-progress-tracking.service';
import { AchievementsStateManagerService } from '../achievement/achievements-state-manager.service';
import { AdService } from '../ad.service';
import { BgsBoardHighlighterService, ShopMinion } from '../battlegrounds/bgs-board-highlighter.service';
import { BattlegroundsQuestsService } from '../battlegrounds/bgs-quests.service';
import { isBattlegrounds } from '../battlegrounds/bgs-utils';
import { CollectionManager } from '../collection/collection-manager.service';
import { SetsManagerService } from '../collection/sets-manager.service';
import { ConstructedMetaDecksStateService } from '../decktracker/constructed-meta-decks-state-builder.service';
import { DecksProviderService } from '../decktracker/main/decks-provider.service';
import { DuelsAdventureInfoService } from '../duels/duels-adventure-info.service';
import { DuelsBucketsService } from '../duels/duels-buckets.service';
import { DuelsDecksProviderService } from '../duels/duels-decks-provider.service';
import { DuelsLeaderboardService } from '../duels/duels-leaderboard.service';
import { DuelsMetaStatsService } from '../duels/duels-meta-stats.service';
import { GameNativeState } from '../game/game-native-state';
import { LotteryWidgetControllerService } from '../lottery/lottery-widget-controller.service';
import { LotteryState } from '../lottery/lottery.model';
import { LotteryService } from '../lottery/lottery.service';
import { CollectionBootstrapService } from '../mainwindow/store/collection-bootstrap.service';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { HighlightSelector } from '../mercenaries/highlights/mercenaries-synergies-highlight.service';
import { PatchesConfigService } from '../patches-config.service';
import { PreferencesService } from '../preferences.service';
import { ProfileDuelsHeroStat } from '../profile/internal/internal-profile-info.service';
import { GameStatsProviderService } from '../stats/game/game-stats-provider.service';
import { arraysEqual } from '../utils';
import { filterBgsMatchStats } from './bgs-ui-helper';

export type Selector<T> = (fullState: [MainWindowState, NavigationState, Preferences?]) => T;
export type GameStatsSelector<T> = (stats: readonly GameStat[]) => T;
export type GameStateSelector<T> = (gameState: GameState) => T;
export type ModsConfigSelector<T> = (conf: ModsConfig) => T;
export type NativeGameStateSelector<T> = (state: GameNativeState) => T;
export type BattlegroundsStateSelector<T> = (state: [BattlegroundsState, Preferences?]) => T;
export type MercenariesStateSelector<T> = (state: [MercenariesBattleState, Preferences?]) => T;
export type MercenariesOutOfCombatStateSelector<T> = (state: [MercenariesOutOfCombatState, Preferences?]) => T;
export type MercenariesHighlightsSelector<T> = (state: [HighlightSelector, Preferences?]) => T;

@Injectable()
export class AppUiStoreService extends Store<Preferences> {
	public eventBus$$ = new BehaviorSubject<StoreEvent>(null);

	private mainStore: BehaviorSubject<[MainWindowState, NavigationState]>;
	private gameNativeState: BehaviorSubject<GameNativeState>;
	private prefs: BehaviorSubject<Preferences>;
	private deckStore: BehaviorSubject<{ state: GameState }>;
	private battlegroundsStore: BehaviorSubject<BattlegroundsState>;
	private mercenariesStore: BehaviorSubject<MercenariesBattleState>;
	private mercenariesOutOfCombatStore: BehaviorSubject<MercenariesOutOfCombatState>;
	private mercenariesSynergiesStore: BehaviorSubject<HighlightSelector>;
	private modsConfig: BehaviorSubject<ModsConfig>;

	private bgsMetaStatsHero: Observable<readonly BgsMetaHeroStatTierItem[]>;
	private bgsQuests: BehaviorSubject<BgsQuestStats>;
	private gameStats: Observable<readonly GameStat[]>;
	private decks: Observable<readonly DeckSummary[]>;
	private duelsHeroStats = new SubscriberAwareBehaviorSubject<readonly DuelsHeroPlayerStat[]>([]);
	private duelsRuns: Observable<readonly DuelsRun[]>;
	private duelsDecks: Observable<readonly DuelsDeckSummary[]>;
	// private duelsTopDecks: Observable<readonly DuelsGroupedDecks[]>;
	private duelsAdventureInfo: Observable<AdventuresInfo>;
	private duelsBuckets: Observable<readonly DuelsBucketsData[]>;
	private duelsMetaStats: Observable<DuelsStat>;
	private duelsLeaderboard: Observable<DuelsLeaderboard>;
	private mails: Observable<MailState>;
	private tavernBrawl: Observable<TavernBrawlState>;
	private cardBacks: Observable<readonly CardBack[]>;
	private allTimeBoosters: Observable<readonly PackInfo[]>;
	private coins: Observable<readonly Coin[]>;
	private collection: Observable<readonly Card[]>;
	private bgHeroSkins: Observable<readonly number[]>;
	private sets: Observable<readonly Set[]>;
	private shouldTrackLottery: Observable<boolean>;
	private shouldShowLotteryOverlay: Observable<boolean>;
	private lottery: Observable<LotteryState>;
	private achievementsProgressTracking: Observable<readonly AchievementsProgressTracking[]>;
	private achievementCategories: Observable<readonly VisualAchievementCategory[]>;
	private achievementsHistory: BehaviorSubject<readonly AchievementHistory[]>;
	private packStats: Observable<readonly PackResult[]>;
	private cardHistory: Observable<readonly CardHistory[]>;
	private profileClassesProgress: Observable<readonly ProfileClassProgress[]>;
	private profileBgHeroStat: Observable<readonly ProfileBgHeroStat[]>;
	private profileDuelsHeroStats: Observable<readonly ProfileDuelsHeroStat[]>;
	private highlightedBgsMinions: Observable<readonly ShopMinion[]>;
	private constructedMetaDecks: Observable<DeckStats>;
	private currentConstructedMetaDeck: Observable<DeckStat>;
	private constructedMetaArchetypes: Observable<ArchetypeStats>;
	private currentConstructedMetaArchetype: Observable<ArchetypeStat>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	private initialized = false;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly ads: AdService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly prefsService: PreferencesService,
	) {
		super();
		window['appStore'] = this;
	}

	// WARNING: All services used here should be called in BootstrapStoreServicesService to make sure they are booted up
	// This is called after all constructors have been called, so everything should be filled
	public async start() {
		await this.prefsService.isReady();

		this.mainStore = this.ow.getMainWindow().mainWindowStoreMerged;
		this.prefs = this.prefsService.preferences$$;
		this.modsConfig = this.ow.getMainWindow().modsConfig;
		this.deckStore = this.ow.getMainWindow().deckEventBus;
		this.gameNativeState = this.ow.getMainWindow().gameNativeStateStore;
		this.battlegroundsStore = this.ow.getMainWindow().battlegroundsStore;
		this.mercenariesStore = this.ow.getMainWindow().mercenariesStore;
		this.mercenariesOutOfCombatStore = this.ow.getMainWindow().mercenariesOutOfCombatStore;
		this.mercenariesSynergiesStore = this.ow.getMainWindow().mercenariesSynergiesStore;
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		this.init();
	}

	public async initComplete(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.initialized) {
					resolve();
				} else {
					// console.debug('wait for store init', new Error().stack);
					setTimeout(() => dbWait(), 500);
				}
			};
			dbWait();
		});
	}

	// Selectors here should do minimal work - just select the data from the state, and not
	// perform any mapping.
	// This is because the selectors are called every time a new state is emitted, so
	// costly operations can still amount to a lot of overhead
	public listen$<S extends Selector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends Selector<infer T> ? T : never }> {
		return combineLatest([this.mainStore, this.prefs]).pipe(
			filter(([[main, nav], prefs]) => !!main && !!nav && !!prefs),
			map(([[main, nav], prefs]) => selectors.map((selector) => selector([main, nav, prefs]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
		) as Observable<{ [K in keyof S]: S[K] extends Selector<infer T> ? T : never }>;
	}

	public listenPrefs$<S extends PrefsSelector<Preferences, any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends PrefsSelector<Preferences, infer T> ? T : never }> {
		return this.prefs.pipe(
			filter((prefs) => !!prefs),
			map((prefs) => selectors.map((selector) => selector(prefs))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
		) as Observable<{ [K in keyof S]: S[K] extends PrefsSelector<Preferences, infer T> ? T : never }>;
	}

	public listenModsConfig$<S extends ModsConfigSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends ModsConfigSelector<infer T> ? T : never }> {
		return this.modsConfig.pipe(
			map((conf) => selectors.map((selector) => selector(conf))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
		) as Observable<{ [K in keyof S]: S[K] extends ModsConfigSelector<infer T> ? T : never }>;
	}

	public listenNativeGameState$<S extends NativeGameStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends NativeGameStateSelector<infer T> ? T : never }> {
		return this.gameNativeState.pipe(
			filter((state) => !!state),
			map((state) => selectors.map((selector) => selector(state))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
		) as Observable<{ [K in keyof S]: S[K] extends NativeGameStateSelector<infer T> ? T : never }>;
	}

	public listenDeckState$<S extends GameStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends GameStateSelector<infer T> ? T : never }> {
		return this.deckStore.pipe(
			filter((gameState) => !!gameState),
			map((gameState) => selectors.map((selector) => selector(gameState.state))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
		) as Observable<{ [K in keyof S]: S[K] extends GameStateSelector<infer T> ? T : never }>;
	}

	public listenBattlegrounds$<S extends BattlegroundsStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends BattlegroundsStateSelector<infer T> ? T : never }> {
		const result = combineLatest([this.battlegroundsStore, this.prefs]).pipe(
			filter(([state, prefs]) => !!state && !!prefs),
			map(([state, prefs]) => selectors.map((selector) => selector([state, prefs]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
		) as Observable<{ [K in keyof S]: S[K] extends BattlegroundsStateSelector<infer T> ? T : never }>;
		return result;
	}

	public listenMercenaries$<S extends MercenariesStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesStateSelector<infer T> ? T : never }> {
		return combineLatest([this.mercenariesStore, this.prefs]).pipe(
			filter(([state, prefs]) => !!prefs),
			map(([state, prefs]) => selectors.map((selector) => selector([state, prefs]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
		) as Observable<{ [K in keyof S]: S[K] extends MercenariesStateSelector<infer T> ? T : never }>;
	}

	public listenMercenariesOutOfCombat$<S extends MercenariesOutOfCombatStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesOutOfCombatStateSelector<infer T> ? T : never }> {
		return combineLatest([this.mercenariesOutOfCombatStore, this.prefs]).pipe(
			filter(([state, prefs]) => !!state && !!prefs),
			map(([state, prefs]) => selectors.map((selector) => selector([state, prefs]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
		) as Observable<{ [K in keyof S]: S[K] extends MercenariesOutOfCombatStateSelector<infer T> ? T : never }>;
	}

	public listenMercenariesHighlights$<S extends MercenariesHighlightsSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesHighlightsSelector<infer T> ? T : never }> {
		return combineLatest([this.mercenariesSynergiesStore, this.prefs]).pipe(
			filter(([highlights, prefs]) => !!prefs),
			map(([highlights, prefs]) => selectors.map((selector) => selector([highlights, prefs]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
		) as Observable<{ [K in keyof S]: S[K] extends MercenariesHighlightsSelector<infer T> ? T : never }>;
	}

	public bgsMetaStatsHero$(): Observable<readonly BgsMetaHeroStatTierItem[]> {
		return this.bgsMetaStatsHero;
	}

	public duelsHeroStats$(): Observable<readonly DuelsHeroPlayerStat[]> {
		return this.duelsHeroStats;
	}

	public gameStats$(): Observable<readonly GameStat[]> {
		return this.gameStats;
	}

	public duelsRuns$(): Observable<readonly DuelsRun[]> {
		return this.duelsRuns;
	}

	public duelsDecks$(): Observable<readonly DuelsDeckSummary[]> {
		return this.duelsDecks;
	}

	// public duelsTopDecks$(): Observable<readonly DuelsGroupedDecks[]> {
	// 	return this.duelsTopDecks;
	// }

	public duelsAdventureInfo$(): Observable<AdventuresInfo> {
		return this.duelsAdventureInfo;
	}

	public duelsBuckets$(): Observable<readonly DuelsBucketsData[]> {
		return this.duelsBuckets;
	}

	public duelsMetaStats$(): Observable<DuelsStat> {
		return this.duelsMetaStats;
	}

	public duelsLeaderboard$(): Observable<DuelsLeaderboard> {
		return this.duelsLeaderboard;
	}

	public mails$(): Observable<MailState> {
		return this.mails;
	}

	public shouldTrackLottery$(): Observable<boolean> {
		return this.shouldTrackLottery;
	}

	public shouldShowLotteryOverlay$(): Observable<boolean> {
		return this.shouldShowLotteryOverlay;
	}

	public cardBacks$(): Observable<readonly CardBack[]> {
		return this.cardBacks;
	}

	public collection$(): Observable<readonly Card[]> {
		return this.collection;
	}

	public coins$(): Observable<readonly Coin[]> {
		return this.coins;
	}

	public bgHeroSkins$(): Observable<readonly number[]> {
		return this.bgHeroSkins;
	}

	public sets$(): Observable<readonly Set[]> {
		return this.sets;
	}

	public allTimeBoosters$(): Observable<readonly PackInfo[]> {
		return this.allTimeBoosters;
	}

	public tavernBrawl$(): Observable<TavernBrawlState> {
		return this.tavernBrawl;
	}

	public decks$(): Observable<readonly DeckSummary[]> {
		return this.decks;
	}

	public showAds$(): Observable<boolean> {
		return this.ads.showAds$$;
	}

	public enablePremiumFeatures$(): Observable<boolean> {
		return this.ads.enablePremiumFeatures$$;
	}

	public hasPremiumSub$(): Observable<boolean> {
		return this.ads.hasPremiumSub$$;
	}

	public lottery$(): Observable<LotteryState> {
		return this.lottery;
	}

	public achievementsProgressTracking$(): Observable<readonly AchievementsProgressTracking[]> {
		return this.achievementsProgressTracking;
	}

	public profileClassesProgress$(): Observable<readonly ProfileClassProgress[]> {
		return this.profileClassesProgress;
	}

	public profileDuelsHeroStats$(): Observable<readonly ProfileDuelsHeroStat[]> {
		return this.profileDuelsHeroStats;
	}

	public profileBgHeroStat$(): Observable<readonly ProfileBgHeroStat[]> {
		return this.profileBgHeroStat;
	}

	public achievementsHistory$(): Observable<readonly AchievementHistory[]> {
		return this.achievementsHistory;
	}

	public bgsQuests$(): BehaviorSubject<BgsQuestStats> {
		return this.bgsQuests;
	}

	public achievementCategories$(): Observable<readonly VisualAchievementCategory[]> {
		return this.achievementCategories;
	}

	public packStats$(): Observable<readonly PackResult[]> {
		return this.packStats;
	}

	public cardHistory$(): Observable<readonly CardHistory[]> {
		return this.cardHistory;
	}

	public highlightedBgsMinions$(): Observable<readonly ShopMinion[]> {
		return this.highlightedBgsMinions;
	}

	public constructedMetaDecks$(): Observable<DeckStats> {
		return this.constructedMetaDecks;
	}

	public currentConstructedMetaDeck$(): Observable<DeckStat> {
		return this.currentConstructedMetaDeck;
	}

	public constructedMetaArchetypes$(): Observable<ArchetypeStats> {
		return this.constructedMetaArchetypes;
	}

	public currentConstructedMetaArchetype$(): Observable<ArchetypeStat> {
		return this.currentConstructedMetaArchetype;
	}

	public send(event: MainWindowStoreEvent) {
		this.stateUpdater.next(event);
	}

	// TODO: this probably makes more sense in a facade. I'll move it when more methods like this
	// start appearing
	private async init() {
		await this.patchesConfig.isReady();
		// Has to be first, since other observables depend on it
		this.initGameStats();
		// Needs to be before duels stuff
		this.initDuelsRuns();
		// The rest
		this.initBgsMetaStatsHero();
		this.initDuelsHeroStats();
		this.initDecks();
		this.initDuelsDecks();
		this.duelsAdventureInfo = (
			this.ow.getMainWindow().duelsAdventureInfo as DuelsAdventureInfoService
		).duelsAdventureInfo$$;
		this.duelsBuckets = (this.ow.getMainWindow().duelsBuckets as DuelsBucketsService).duelsBuckets$$;
		this.duelsMetaStats = (this.ow.getMainWindow().duelsMetaStats as DuelsMetaStatsService).duelsMetaStats$$;
		this.duelsLeaderboard = (
			this.ow.getMainWindow().duelsLeaderboard as DuelsLeaderboardService
		).duelsLeaderboard$$;
		this.initMails();
		this.initCardBacks();
		this.initCoins();
		this.initCollection();
		this.initBgHeroSkins();
		this.initSets();
		this.initAllTimeBoosters();
		this.initTavernBrawl();
		this.initShouldTrackLottery();
		this.initShouldShowLotteryOverlay();
		this.initLottery();
		this.initAchievementsProgressTracking();
		this.initProfileClassProgress();
		this.initProfileDuelsHeroStat();
		this.initProfileBgHeroStat();
		this.initBgsQuests();
		this.initAchievementCategories();
		this.achievementsHistory = (
			this.ow.getMainWindow().achievementsHistory as AchievementHistoryService
		).achievementsHistory$$;
		this.initPackStats();
		this.initCardsHistory();
		this.initHighlightedBgsMinions();
		this.constructedMetaDecks = (
			this.ow.getMainWindow().constructedMetaDecks as ConstructedMetaDecksStateService
		).constructedMetaDecks$$;
		this.currentConstructedMetaDeck = (
			this.ow.getMainWindow().constructedMetaDecks as ConstructedMetaDecksStateService
		).currentConstructedMetaDeck$$;
		this.constructedMetaArchetypes = (
			this.ow.getMainWindow().constructedMetaDecks as ConstructedMetaDecksStateService
		).constructedMetaArchetypes$$;
		this.currentConstructedMetaArchetype = (
			this.ow.getMainWindow().constructedMetaDecks as ConstructedMetaDecksStateService
		).currentConstructedMetaArchetype$$;
		// this.duelsTopDecks = (this.ow.getMainWindow().duelsTopDeckService as DuelsTopDeckService).topDeck$$;
		this.initialized = true;
	}

	private initTavernBrawl() {
		this.tavernBrawl = (this.ow.getMainWindow().tavernBrawlProvider as TavernBrawlService).tavernBrawl$;
	}

	private initAllTimeBoosters() {
		this.allTimeBoosters = (this.ow.getMainWindow().collectionManager as CollectionManager).allTimeBoosters$$;
	}

	private initSets() {
		this.sets = (this.ow.getMainWindow().setsManager as SetsManagerService).sets$$;
	}

	private initBgHeroSkins() {
		this.bgHeroSkins = (this.ow.getMainWindow().collectionManager as CollectionManager).bgHeroSkins$$;
	}

	private initCollection() {
		this.collection = (this.ow.getMainWindow().collectionManager as CollectionManager).collection$$;
	}

	private initCoins() {
		this.coins = (this.ow.getMainWindow().collectionManager as CollectionManager).coins$$;
	}

	private initCardBacks() {
		this.cardBacks = (this.ow.getMainWindow().collectionManager as CollectionManager).cardBacks$$;
	}

	private initMails() {
		this.mails = (this.ow.getMainWindow().mailsProvider as MailsService).mails$;
	}

	private initShouldTrackLottery() {
		this.shouldTrackLottery = (
			this.ow.getMainWindow().lotteryWidgetController as LotteryWidgetControllerService
		).shouldTrack$$;
	}

	private initShouldShowLotteryOverlay() {
		this.shouldShowLotteryOverlay = (
			this.ow.getMainWindow().lotteryWidgetController as LotteryWidgetControllerService
		).shouldShowOverlay$$;
	}

	private initLottery() {
		this.lottery = (this.ow.getMainWindow().lotteryProvider as LotteryService).lottery$$;
	}

	private initAchievementsProgressTracking() {
		this.achievementsProgressTracking = (
			this.ow.getMainWindow().achievementsMonitor as AchievementsLiveProgressTrackingService
		).achievementsProgressTracking$$;
	}

	private initProfileClassProgress() {
		this.profileClassesProgress = this.ow.getMainWindow().profileClassesProgress as BehaviorSubject<
			readonly ProfileClassProgress[]
		>;
	}

	private initProfileDuelsHeroStat() {
		this.profileDuelsHeroStats = this.ow.getMainWindow().profileDuelsHeroStats as BehaviorSubject<
			readonly ProfileDuelsHeroStat[]
		>;
	}

	private initProfileBgHeroStat() {
		this.profileBgHeroStat = this.ow.getMainWindow().profileBgHeroStat as BehaviorSubject<
			readonly ProfileBgHeroStat[]
		>;
	}

	private initAchievementCategories() {
		this.achievementCategories = (
			this.ow.getMainWindow().achievementsStateManager as AchievementsStateManagerService
		).groupedAchievements$$;
	}

	private initBgsQuests() {
		this.bgsQuests = (this.ow.getMainWindow().bgsQuests as BattlegroundsQuestsService).questStats$$;
	}

	private initPackStats() {
		this.packStats = (this.ow.getMainWindow().collectionBootstrap as CollectionBootstrapService).packStats$$;
	}

	private initCardsHistory() {
		this.cardHistory = (this.ow.getMainWindow().collectionBootstrap as CollectionBootstrapService).cardHistory$$;
	}

	private initDuelsDecks() {
		this.duelsDecks = (this.ow.getMainWindow().duelsDecksProvider as DuelsDecksProviderService).duelsDecks$$;
	}

	private initDuelsRuns() {
		this.duelsRuns = (this.ow.getMainWindow().duelsDecksProvider as DuelsDecksProviderService).duelsRuns$$;
	}

	private initDecks() {
		this.decks = (this.ow.getMainWindow().decksProvider as DecksProviderService).decks$;
	}

	private initGameStats() {
		this.gameStats = (this.ow.getMainWindow().gameStatsProvider as GameStatsProviderService).gameStats$;
	}

	private initHighlightedBgsMinions() {
		this.highlightedBgsMinions = (
			this.ow.getMainWindow().bgsBoardHighlighter as BgsBoardHighlighterService
		).shopMinions$$;
	}

	private initDuelsHeroStats() {
		this.duelsHeroStats.onFirstSubscribe(() => {
			combineLatest([
				this.duelsRuns$(),
				this.duelsMetaStats$(),
				this.listen$(
					([main, nav]) => nav.navigationDuels.heroSearchString,
					([main, nav, prefs]) => prefs.duelsActiveStatTypeFilter,
					([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
					([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
					([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
					([main, nav, prefs]) => prefs.duelsActiveHeroPowerFilter2,
					([main, nav, prefs]) => prefs.duelsActiveSignatureTreasureFilter2,
				),
				this.patchesConfig.currentDuelsMetaPatch$$,
			])
				.pipe(
					map(
						([
							runs,
							duelStats,
							[
								heroSearchString,
								statType,
								gameMode,
								timeFilter,
								heroFilter,
								heroPowerFilter,
								sigTreasureFilter,
							],
							patch,
						]) =>
							[
								filterDuelsHeroStats(
									duelStats?.heroes,
									heroFilter,
									heroPowerFilter,
									sigTreasureFilter,
									statType,
									this.allCards,
									heroSearchString,
								),
								filterDuelsRuns(
									runs,
									timeFilter,
									heroFilter,
									gameMode,
									null,
									patch,
									0,
									heroPowerFilter,
									sigTreasureFilter,
									statType,
								),
								statType,
							] as [readonly DuelsHeroStat[], readonly DuelsRun[], DuelsStatTypeFilterType],
					),
					distinctUntilChanged((a, b) => arraysEqual(a, b)),
					map(([duelStats, duelsRuns, statType]) =>
						buildDuelsHeroPlayerStats(duelStats, statType, duelsRuns),
					),
				)
				.subscribe(this.duelsHeroStats);
		});
	}

	private initBgsMetaStatsHero() {
		const statsWithOnlyGlobalData$ = combineLatest([
			this.listen$(([main]) => main.battlegrounds.getMetaHeroStats() ?? null),
			this.listenPrefs$(
				(prefs) => prefs.bgsActiveRankFilter,
				(prefs) => prefs.bgsActiveTribesFilter,
				(prefs) => prefs.bgsActiveAnomaliesFilter,
				(prefs) => prefs.bgsHeroesUseConservativeEstimate,
				(prefs) => prefs.bgsActiveUseMmrFilterInHeroSelection,
				(prefs) => prefs.bgsActiveUseAnomalyFilterInHeroSelection,
			),
		]).pipe(
			debounceTime(200),
			distinctUntilChanged(),
			map(
				([
					[stats],
					[
						bgsActiveRankFilter,
						bgsActiveTribesFilter,
						bgsActiveAnomaliesFilter,
						bgsHeroesUseConservativeEstimate,
						useMmrFilter,
						useAnomalyFilter,
					],
				]) => {
					console.debug(
						'[bgs-1] rebuilding meta hero stats 1',
						stats,
						'rankFilter',
						bgsActiveRankFilter,
						'tribesFilter',
						bgsActiveTribesFilter,
						'anomaliesFilter',
						bgsActiveAnomaliesFilter,
						'bgsHeroesUseConservativeEstimate',
						bgsHeroesUseConservativeEstimate,
						'useMmrFilter',
						useMmrFilter,
						'useAnomalyFilter',
						useAnomalyFilter,
					);
					const result: readonly BgsMetaHeroStatTierItem[] = !stats?.heroStats
						? null
						: buildHeroStats(
								stats?.heroStats,
								// bgsActiveRankFilter,
								bgsActiveTribesFilter,
								bgsActiveAnomaliesFilter,
								bgsHeroesUseConservativeEstimate,
								useMmrFilter,
								useAnomalyFilter,
								this.allCards,
						  );
					return result;
				},
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		);

		const playerBgGames$ = combineLatest([
			this.gameStats,
			this.listen$(([main]) => main.battlegrounds.getMetaHeroStats()?.mmrPercentiles ?? []),
			this.patchesConfig.currentBattlegroundsMetaPatch$$,
			this.listenPrefs$(
				(prefs) => prefs.bgsActiveRankFilter,
				(prefs) => prefs.bgsActiveTribesFilter,
				(prefs) => prefs.bgsActiveAnomaliesFilter,
				(prefs) => prefs.bgsActiveTimeFilter,
				(prefs) => prefs.bgsActiveUseMmrFilterInHeroSelection,
				(prefs) => prefs.bgsActiveUseAnomalyFilterInHeroSelection,
			),
		]).pipe(
			// distinctUntilChanged(),
			map(
				([
					games,
					[mmrPercentiles],
					patchInfo,
					[rankFilter, tribesFilter, anomaliesFilter, timeFilter, useMmrFilter, useAnomalyFilter],
				]) => {
					console.debug('[bgs-2] rebuilding meta hero stats 2', arguments);
					const targetRank: number =
						!mmrPercentiles?.length || !rankFilter || !useMmrFilter
							? 0
							: mmrPercentiles.find((m) => m.percentile === rankFilter)?.mmr ?? 0;
					const bgGames = (games ?? [])
						.filter((g) => isBattlegrounds(g.gameMode))
						.filter(
							(g) =>
								!tribesFilter?.length ||
								tribesFilter.length === ALL_BG_RACES.length ||
								tribesFilter.some((t) => g.bgsAvailableTribes?.includes(t)),
						)
						.filter(
							(g) =>
								!anomaliesFilter?.length ||
								!useAnomalyFilter ||
								anomaliesFilter.some((a) => g.bgsAnomalies?.includes(a)),
						);
					const afterFilter = filterBgsMatchStats(bgGames, timeFilter, targetRank, patchInfo);
					return afterFilter;
				},
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		);

		this.bgsMetaStatsHero = combineLatest([statsWithOnlyGlobalData$, playerBgGames$]).pipe(
			tap((info) => console.debug('[bgs-3] rebuilding meta hero stats 3', info)),
			map(([stats, playerBgGames]) => stats?.map((stat) => enhanceHeroStat(stat, playerBgGames, this.allCards))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
		);
	}
}

export const currentBgHeroId = (battlegrounds: BattlegroundsAppState, selectedCategoryId: string): string => {
	return selectedCategoryId?.includes('bgs-category-personal-hero-details-')
		? selectedCategoryId.split('bgs-category-personal-hero-details-')[1]
		: null;
};

export const cdLog = (...args) => {
	if (process.env.NODE_ENV !== 'production') {
		// console.debug('[cd]', ...args);
	}
};

export interface StoreEvent {
	readonly name: StoreEventName;
	readonly data?: any;
}

export type StoreEventName = 'lottery-visibility-changed' | 'lottery-closed';
