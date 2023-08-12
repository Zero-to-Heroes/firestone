import { EventEmitter, Injectable } from '@angular/core';
import { DuelsHeroStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { ALL_BG_RACES } from '@firestone-hs/reference-data';
import { BgsMetaHeroStatTierItem, buildHeroStats, enhanceHeroStat } from '@firestone/battlegrounds/data-access';
import { filterDuelsHeroStats } from '@firestone/duels/data-access';
import { PrefsSelector, Store } from '@firestone/shared/framework/common';
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

import { ProfileClassProgress } from '@firestone-hs/api-user-profile';
import { BgsQuestStats } from '@firestone-hs/bgs-global-stats';
import { PackResult } from '@firestone-hs/user-packs';
import { PackInfo } from '@firestone/collection/view';
import { TavernBrawlService } from '../../../libs/tavern-brawl/services/tavern-brawl.service';
import { TavernBrawlState } from '../../../libs/tavern-brawl/tavern-brawl-state';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { CardHistory } from '../../models/card-history';
import { Coin } from '../../models/coin';
import { GameState } from '../../models/decktracker/game-state';
import { DuelsGroupedDecks } from '../../models/duels/duels-grouped-decks';
import { DuelsDeckSummary } from '../../models/duels/duels-personal-deck';
import { BattlegroundsAppState } from '../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { DeckSummary } from '../../models/mainwindow/decktracker/deck-summary';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { MercenariesBattleState } from '../../models/mercenaries/mercenaries-battle-state';
import { MercenariesOutOfCombatState } from '../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { Preferences } from '../../models/preferences';
import { Set } from '../../models/set';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';
import {
	AchievementsLiveProgressTrackingService,
	AchievementsProgressTracking,
} from '../achievement/achievements-live-progress-tracking.service';
import { AchievementsStateManagerService } from '../achievement/achievements-state-manager.service';
import { AdService } from '../ad.service';
import { BattlegroundsQuestsService } from '../battlegrounds/bgs-quests.service';
import { isBattlegrounds } from '../battlegrounds/bgs-utils';
import { CollectionManager } from '../collection/collection-manager.service';
import { SetsManagerService } from '../collection/sets-manager.service';
import { DecksProviderService } from '../decktracker/main/decks-provider.service';
import { DuelsDecksProviderService } from '../duels/duels-decks-provider.service';
import { DuelsTopDeckService } from '../duels/duels-top-decks.service';
import { GameNativeState } from '../game/game-native-state';
import { LotteryWidgetControllerService } from '../lottery/lottery-widget-controller.service';
import { LotteryState } from '../lottery/lottery.model';
import { LotteryService } from '../lottery/lottery.service';
import { CollectionBootstrapService } from '../mainwindow/store/collection-bootstrap.service';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { HighlightSelector } from '../mercenaries/highlights/mercenaries-synergies-highlight.service';
import { GameStatsProviderService } from '../stats/game/game-stats-provider.service';
import { arraysEqual, sleep } from '../utils';
import { filterBgsMatchStats } from './bgs-ui-helper';

export type Selector<T> = (fullState: [MainWindowState, NavigationState, Preferences?]) => T;
export type GameStatsSelector<T> = (stats: readonly GameStat[]) => T;
export type GameStateSelector<T> = (gameState: GameState) => T;
export type ModsConfigSelector<T> = (conf: ModsConfig) => T;
export type NativeGameStateSelector<T> = (state: GameNativeState) => T;
export type BattlegroundsStateSelector<T> = (state: [BattlegroundsState, Preferences?]) => T;
export type MercenariesStateSelector<T> = (
	state: [MercenariesBattleState, { name: string; preferences: Preferences }?],
) => T;
export type MercenariesOutOfCombatStateSelector<T> = (
	state: [MercenariesOutOfCombatState, { name: string; preferences: Preferences }?],
) => T;
export type MercenariesHighlightsSelector<T> = (
	state: [HighlightSelector, { name: string; preferences: Preferences }?],
) => T;

@Injectable()
export class AppUiStoreService extends Store<Preferences> {
	public eventBus$$ = new BehaviorSubject<StoreEvent>(null);

	private mainStore: BehaviorSubject<[MainWindowState, NavigationState]>;
	private gameNativeState: BehaviorSubject<GameNativeState>;
	private prefs: BehaviorSubject<{ name: string; preferences: Preferences }>;
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
	private duelsHeroStats: Observable<readonly DuelsHeroPlayerStat[]>;
	private duelsRuns: Observable<readonly DuelsRun[]>;
	private duelsDecks: Observable<readonly DuelsDeckSummary[]>;
	private duelsTopDecks: Observable<readonly DuelsGroupedDecks[]>;
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
	private packStats: Observable<readonly PackResult[]>;
	private cardHistory: Observable<readonly CardHistory[]>;
	private profileClassesProgress: Observable<readonly ProfileClassProgress[]>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	private initialized = false;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly ads: AdService,
	) {
		super();
		window['appStore'] = this;
		window['snapshotAppStore'] = (showLog = true) => {
			const snapshot = {
				mainStore: this.mainStore.observers,
				gameNativeState: this.gameNativeState.observers,
				prefs: this.prefs.observers,
				modsConfig: this.modsConfig.observers,
				deckStore: this.deckStore.observers,
				battlegroundsStore: this.battlegroundsStore.observers,
				mercenariesStore: this.mercenariesStore.observers,
				mercenariesOutOfCombatStore: this.mercenariesOutOfCombatStore.observers,
				mercenariesSynergiesStore: this.mercenariesSynergiesStore.observers,
				// bgsMetaStatsHero: this.bgsMetaStatsHero,
				// bgsMetaStatsHero: this.bgsMetaStatsHero.observers,
				// duelsHeroStats: this.duelsHeroStats.observers,
				// gameStats: this.gameStats.observers,
				// decks: this.decks.observers,
				// duelsRuns: this.duelsRuns.observers,
				// duelsDecks: this.duelsDecks.observers,
				// mails: this.mails.observers,
				// tavernBrawl: this.tavernBrawl.observers,
			};
			showLog && console.debug(snapshot);
			return snapshot;
		};
		let previousSnapshot = {};
		window['debugAppStore'] = () => {
			const result = {};
			const newSnapshot = window['snapshotAppStore'](false);
			for (const key of Object.keys(newSnapshot)) {
				const oldObservers = previousSnapshot[key] ?? [];
				const newObservers = newSnapshot[key];
				const changedObservers = [];
				// Because sometimes between two snapshot, the same observers have been deleted then recreated.
				// In that case, we don't want to list the newly created obs (which simply replace the old ones
				// that were removed, but which won't have the same IDs)
				if (newObservers.length > oldObservers.length) {
					for (const obs of newObservers) {
						if (!oldObservers.find((o) => o.subscriberId === obs.subscriberId)) {
							// console.debug('could not find old obs', obs.subscriberId, oldObservers, obs);
							changedObservers.push(obs);
						}
					}
				}
				// console.debug('updated for', key, newObservers.length, oldObservers.length, changedObservers);
				result[key] = changedObservers;
				if (!changedObservers.length && newObservers.length > oldObservers.length) {
					console.warn('didnt detect changes', newObservers, oldObservers);
				}
			}
			const snapshotToMap = {};
			Object.keys(newSnapshot).forEach((key) => {
				snapshotToMap[key] = newSnapshot[key].map((o) => ({
					subscriberId: o.subscriberId,
				}));
			});
			previousSnapshot = snapshotToMap;
			return result;
		};
	}

	// WARNING: All services used here should be called in BootstrapStoreServicesService to make sure they are booted up
	// This is called after all constructors have been called, so everything should be filled
	public start() {
		this.mainStore = this.ow.getMainWindow().mainWindowStoreMerged;
		this.prefs = this.ow.getMainWindow().preferencesEventBus;
		this.modsConfig = this.ow.getMainWindow().modsConfig;
		this.deckStore = this.ow.getMainWindow().deckEventBus;
		this.gameNativeState = this.ow.getMainWindow().gameNativeStateStore;
		this.battlegroundsStore = this.ow.getMainWindow().battlegroundsStore;
		this.mercenariesStore = this.ow.getMainWindow().mercenariesStore;
		this.mercenariesOutOfCombatStore = this.ow.getMainWindow().mercenariesOutOfCombatStore;
		this.mercenariesSynergiesStore = this.ow.getMainWindow().mercenariesSynergiesStore;
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;

		if (
			!this.mainStore ||
			!this.gameNativeState ||
			!this.prefs ||
			!this.modsConfig ||
			!this.deckStore ||
			!this.battlegroundsStore ||
			!this.mercenariesStore ||
			!this.mercenariesOutOfCombatStore ||
			!this.mercenariesSynergiesStore ||
			!this.stateUpdater
		) {
			console.error('incomplete init', this);
		}

		this.init();
	}

	public async initComplete(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.initialized) {
					resolve();
				} else {
					console.warn('wait for store init');
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
		this.debugCall('listen$');
		return combineLatest(this.mainStore, this.prefs).pipe(
			filter(([[main, nav], prefs]) => !!main && !!nav && !!prefs?.preferences),
			map(([[main, nav], prefs]) => selectors.map((selector) => selector([main, nav, prefs?.preferences]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends Selector<infer T> ? T : never }>;
	}

	public listenPrefs$<S extends PrefsSelector<Preferences, any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends PrefsSelector<Preferences, infer T> ? T : never }> {
		this.debugCall('listenPrefs$');
		return this.prefs.pipe(
			filter((prefs) => !!prefs?.preferences),
			map((prefs) => selectors.map((selector) => selector(prefs.preferences))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends PrefsSelector<Preferences, infer T> ? T : never }>;
	}

	public listenModsConfig$<S extends ModsConfigSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends ModsConfigSelector<infer T> ? T : never }> {
		this.debugCall('listenModsConfigs$');
		return this.modsConfig.pipe(
			map((conf) => selectors.map((selector) => selector(conf))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends ModsConfigSelector<infer T> ? T : never }>;
	}

	public listenNativeGameState$<S extends NativeGameStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends NativeGameStateSelector<infer T> ? T : never }> {
		this.debugCall('listenNativeGameState$');
		return this.gameNativeState.pipe(
			filter((state) => !!state),
			map((state) => selectors.map((selector) => selector(state))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends NativeGameStateSelector<infer T> ? T : never }>;
	}

	public listenDeckState$<S extends GameStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends GameStateSelector<infer T> ? T : never }> {
		this.debugCall('listenDeckState$');
		return this.deckStore.pipe(
			filter((gameState) => !!gameState),
			map((gameState) => selectors.map((selector) => selector(gameState.state))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends GameStateSelector<infer T> ? T : never }>;
	}

	public listenBattlegrounds$<S extends BattlegroundsStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends BattlegroundsStateSelector<infer T> ? T : never }> {
		this.debugCall('listenBattlegrounds$');
		const result = combineLatest(this.battlegroundsStore, this.prefs).pipe(
			filter(([state, prefs]) => !!state && !!prefs?.preferences),
			map(([state, prefs]) => selectors.map((selector) => selector([state, prefs.preferences]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends BattlegroundsStateSelector<infer T> ? T : never }>;
		return result;
	}

	public listenMercenaries$<S extends MercenariesStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesStateSelector<infer T> ? T : never }> {
		this.debugCall('listenMercenaries$');
		return combineLatest(this.mercenariesStore, this.prefs).pipe(
			filter(([state, prefs]) => !!prefs?.preferences),
			map(([state, prefs]) => selectors.map((selector) => selector([state, prefs]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends MercenariesStateSelector<infer T> ? T : never }>;
	}

	public listenMercenariesOutOfCombat$<S extends MercenariesOutOfCombatStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesOutOfCombatStateSelector<infer T> ? T : never }> {
		this.debugCall('listenMercenariesOutOfCombat$');
		return combineLatest(this.mercenariesOutOfCombatStore, this.prefs).pipe(
			filter(([state, prefs]) => !!state && !!prefs?.preferences),
			map(([state, prefs]) => selectors.map((selector) => selector([state, prefs]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends MercenariesOutOfCombatStateSelector<infer T> ? T : never }>;
	}

	public listenMercenariesHighlights$<S extends MercenariesHighlightsSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesHighlightsSelector<infer T> ? T : never }> {
		this.debugCall('listenMercenariesHighlights$');
		return combineLatest(this.mercenariesSynergiesStore, this.prefs).pipe(
			filter(([highlights, prefs]) => !!prefs?.preferences),
			map(([highlights, prefs]) => selectors.map((selector) => selector([highlights, prefs]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends MercenariesHighlightsSelector<infer T> ? T : never }>;
	}

	public bgsMetaStatsHero$(): Observable<readonly BgsMetaHeroStatTierItem[]> {
		this.debugCall('bgHeroStats$');
		return this.bgsMetaStatsHero.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public duelsHeroStats$(): Observable<readonly DuelsHeroPlayerStat[]> {
		this.debugCall('duelsHeroStats$');
		return this.duelsHeroStats.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public gameStats$(): Observable<readonly GameStat[]> {
		this.debugCall('gameStats$');
		return this.gameStats.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public duelsRuns$(): Observable<readonly DuelsRun[]> {
		this.debugCall('duelsRuns$');
		return this.duelsRuns.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public duelsDecks$(): Observable<readonly DuelsDeckSummary[]> {
		this.debugCall('duelsDecks$');
		const result = this.duelsDecks.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
		return result;
	}

	public duelsTopDecks$(): Observable<readonly DuelsGroupedDecks[]> {
		return this.duelsTopDecks;
	}

	public mails$(): Observable<MailState> {
		this.debugCall('mails$');
		return this.mails.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public shouldTrackLottery$(): Observable<boolean> {
		return this.shouldTrackLottery.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public shouldShowLotteryOverlay$(): Observable<boolean> {
		return this.shouldShowLotteryOverlay.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public cardBacks$(): Observable<readonly CardBack[]> {
		return this.cardBacks.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public collection$(): Observable<readonly Card[]> {
		this.debugCall('collection$');
		return this.collection.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public coins$(): Observable<readonly Coin[]> {
		this.debugCall('coins$');
		return this.coins.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public bgHeroSkins$(): Observable<readonly number[]> {
		this.debugCall('bgHeroSkins$');
		return this.bgHeroSkins.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public sets$(): Observable<readonly Set[]> {
		this.debugCall('sets$');
		return this.sets.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public allTimeBoosters$(): Observable<readonly PackInfo[]> {
		return this.allTimeBoosters.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public tavernBrawl$(): Observable<TavernBrawlState> {
		this.debugCall('tavernBrawl$');
		return this.tavernBrawl.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public decks$(): Observable<readonly DeckSummary[]> {
		this.debugCall('decks$');
		return this.decks.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public showAds$(): Observable<boolean> {
		this.debugCall('shouldShowAds$');
		return this.ads.showAds$$.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public enablePremiumFeatures$(): Observable<boolean> {
		return this.ads.enablePremiumFeatures$$.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public hasPremiumSub$(): Observable<boolean> {
		return this.ads.hasPremiumSub$$.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public lottery$(): Observable<LotteryState> {
		return this.lottery.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public achievementsProgressTracking$(): Observable<readonly AchievementsProgressTracking[]> {
		return this.achievementsProgressTracking.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public profileClassesProgress$(): Observable<readonly ProfileClassProgress[]> {
		return this.profileClassesProgress;
	}

	public bgsQuests$(): BehaviorSubject<BgsQuestStats> {
		return this.bgsQuests;
	}

	public achievementCategories$(): Observable<readonly VisualAchievementCategory[]> {
		return this.achievementCategories;
	}

	public packStats$(): Observable<readonly PackResult[]> {
		return this.packStats.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public cardHistory$(): Observable<readonly CardHistory[]> {
		return this.cardHistory.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public send(event: MainWindowStoreEvent) {
		this.stateUpdater.next(event);
	}

	// TODO: this probably makes more sense in a facade. I'll move it when more methods like this
	// start appearing
	private async init() {
		// Has to be first, since other observables depend on it
		this.initGameStats();
		// Needs to be before duels stuff
		this.initDuelsRuns();
		// The rest
		this.initBgsMetaStatsHero();
		this.initDuelsHeroStats();
		this.initDecks();
		this.initDuelsDecks();
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
		this.initBgsQuests();
		this.initAchievementCategories();
		this.initPackStats();
		this.initCardsHistory();
		await this.initDuelsTopDecks();
		this.initialized = true;
	}

	private initTavernBrawl() {
		this.tavernBrawl = (this.ow.getMainWindow().tavernBrawlProvider as TavernBrawlService).tavernBrawl$.pipe(
			shareReplay(1),
		);
		// tavernBrawl.subscribe(this.tavernBrawl);
	}

	private initAllTimeBoosters() {
		this.allTimeBoosters = (this.ow.getMainWindow().collectionManager as CollectionManager).allTimeBoosters$$.pipe(
			shareReplay(1),
		);
	}

	private initSets() {
		this.sets = (this.ow.getMainWindow().setsManager as SetsManagerService).sets$$.pipe(shareReplay(1));
	}

	private initBgHeroSkins() {
		this.bgHeroSkins = (this.ow.getMainWindow().collectionManager as CollectionManager).bgHeroSkins$$.pipe(
			shareReplay(1),
		);
	}

	private initCollection() {
		this.collection = (this.ow.getMainWindow().collectionManager as CollectionManager).collection$$.pipe(
			shareReplay(1),
		);
	}

	private initCoins() {
		this.coins = (this.ow.getMainWindow().collectionManager as CollectionManager).coins$$.pipe(shareReplay(1));
	}

	private initCardBacks() {
		this.cardBacks = (this.ow.getMainWindow().collectionManager as CollectionManager).cardBacks$$.pipe(
			shareReplay(1),
		);
	}

	private initMails() {
		this.mails = (this.ow.getMainWindow().mailsProvider as MailsService).mails$.pipe(shareReplay(1));
	}

	private initShouldTrackLottery() {
		this.shouldTrackLottery = (
			this.ow.getMainWindow().lotteryWidgetController as LotteryWidgetControllerService
		).shouldTrack$$.pipe(shareReplay(1));
	}

	private initShouldShowLotteryOverlay() {
		this.shouldShowLotteryOverlay = (
			this.ow.getMainWindow().lotteryWidgetController as LotteryWidgetControllerService
		).shouldShowOverlay$$.pipe(shareReplay(1));
	}

	private initLottery() {
		this.lottery = (this.ow.getMainWindow().lotteryProvider as LotteryService).lottery$$.pipe(shareReplay(1));
	}

	private initAchievementsProgressTracking() {
		this.achievementsProgressTracking = (
			this.ow.getMainWindow().achievementsMonitor as AchievementsLiveProgressTrackingService
		).achievementsProgressTracking$$.pipe(shareReplay(1));
	}

	private initProfileClassProgress() {
		this.profileClassesProgress = this.ow.getMainWindow().profileClassesProgress as BehaviorSubject<
			readonly ProfileClassProgress[]
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
		this.packStats = (this.ow.getMainWindow().collectionBootstrap as CollectionBootstrapService).packStats$$.pipe(
			shareReplay(1),
		);
	}

	private initCardsHistory() {
		this.cardHistory = (
			this.ow.getMainWindow().collectionBootstrap as CollectionBootstrapService
		).cardHistory$$.pipe(
			// distinctUntilChanged((a, b) => a == b || a?.[0]?.creationTimestamp === b?.[0]?.creationTimestamp),
			shareReplay(1),
		);
	}

	private initDuelsDecks() {
		this.duelsDecks = (this.ow.getMainWindow().duelsDecksProvider as DuelsDecksProviderService).duelsDecks$.pipe(
			shareReplay(1),
		);
	}

	private async initDuelsTopDecks() {
		while (!this.duelsTopDecks) {
			this.duelsTopDecks = (this.ow.getMainWindow().duelsTopDeckService as DuelsTopDeckService).topDeck$;
			await sleep(50);
		}
	}

	private initDuelsRuns() {
		this.duelsRuns = (this.ow.getMainWindow().duelsDecksProvider as DuelsDecksProviderService).duelsRuns$.pipe(
			shareReplay(1),
		);
	}

	private initDecks() {
		this.decks = (this.ow.getMainWindow().decksProvider as DecksProviderService).decks$.pipe(shareReplay(1));
	}

	private initGameStats() {
		this.gameStats = (this.ow.getMainWindow().gameStatsProvider as GameStatsProviderService).gameStats$.pipe(
			shareReplay(1),
		);
	}

	private initDuelsHeroStats() {
		this.duelsHeroStats = combineLatest([
			this.duelsRuns,
			this.listen$(
				([main, nav]) => main.duels.globalStats?.heroes,
				([main, nav]) => nav.navigationDuels.heroSearchString,
				([main, nav, prefs]) => prefs.duelsActiveStatTypeFilter,
				([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
				([main, nav, prefs]) => prefs.duelsActiveHeroPowerFilter2,
				([main, nav, prefs]) => prefs.duelsActiveSignatureTreasureFilter2,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
			),
		]).pipe(
			map(
				([
					runs,
					[
						duelStats,
						heroSearchString,
						statType,
						gameMode,
						timeFilter,
						heroFilter,
						heroPowerFilter,
						sigTreasureFilter,
						patch,
					],
				]) =>
					[
						filterDuelsHeroStats(
							duelStats,
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
			map(([duelStats, duelsRuns, statType]) => buildDuelsHeroPlayerStats(duelStats, statType, duelsRuns)),
			shareReplay(1),
		);
	}

	private initBgsMetaStatsHero() {
		const statsWithOnlyGlobalData$ = combineLatest([
			this.listen$(([main]) => main.battlegrounds.getMetaHeroStats() ?? null),
			this.listenPrefs$(
				(prefs) => prefs.bgsActiveRankFilter,
				(prefs) => prefs.bgsActiveTribesFilter,
				(prefs) => prefs.bgsHeroesUseConservativeEstimate,
			),
		]).pipe(
			debounceTime(200),
			distinctUntilChanged(),
			map(([[stats], [bgsActiveRankFilter, bgsActiveTribesFilter, bgsHeroesUseConservativeEstimate]]) => {
				console.debug(
					'[bgs-1] rebuilding meta hero stats 1',
					stats,
					'rankFilter',
					bgsActiveRankFilter,
					'tribesFilter',
					bgsActiveTribesFilter,
					'bgsHeroesUseConservativeEstimate',
					bgsHeroesUseConservativeEstimate,
				);
				const result: readonly BgsMetaHeroStatTierItem[] = buildHeroStats(
					stats?.heroStats,
					bgsActiveRankFilter,
					bgsActiveTribesFilter,
					bgsHeroesUseConservativeEstimate,
					this.allCards,
				);
				return result;
			}),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		);

		const playerBgGames$ = combineLatest([
			this.gameStats,
			this.listen$(
				([main]) => main.battlegrounds.getMetaHeroStats()?.mmrPercentiles ?? [],
				([main]) => main.battlegrounds.currentBattlegroundsMetaPatch,
			),
			this.listenPrefs$(
				(prefs) => prefs.bgsActiveRankFilter,
				(prefs) => prefs.bgsActiveTribesFilter,
				(prefs) => prefs.bgsActiveTimeFilter,
			),
		]).pipe(
			// distinctUntilChanged(),
			map(([games, [mmrPercentiles, patchInfo], [rankFilter, tribesFilter, timeFilter]]) => {
				console.debug('[bgs-1] rebuilding meta hero stats 2');
				const targetRank: number =
					!mmrPercentiles?.length || !rankFilter
						? 0
						: mmrPercentiles.find((m) => m.percentile === rankFilter)?.mmr ?? 0;
				const bgGames = games
					.filter((g) => isBattlegrounds(g.gameMode))
					.filter(
						(g) =>
							!tribesFilter?.length ||
							tribesFilter.length === ALL_BG_RACES.length ||
							tribesFilter.some((t) => g.bgsAvailableTribes?.includes(t)),
					);
				const afterFilter = filterBgsMatchStats(bgGames, timeFilter, targetRank, patchInfo);
				return afterFilter;
			}),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		);

		const enhancedStats$ = combineLatest([statsWithOnlyGlobalData$, playerBgGames$]).pipe(
			tap((info) => console.debug('[bgs-1] rebuilding meta hero stats 3', info)),
			map(
				([stats, playerBgGames]) =>
					stats?.map((stat) => enhanceHeroStat(stat, playerBgGames, this.allCards)) ?? [],
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
		);

		this.bgsMetaStatsHero = enhancedStats$;
	}

	private debugCall(...args) {
		return;
		console.debug('[store]', args, new Error());
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
