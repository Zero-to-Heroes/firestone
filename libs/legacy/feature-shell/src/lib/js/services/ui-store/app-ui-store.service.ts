import { EventEmitter, Injectable } from '@angular/core';
import { PrefsSelector, Store } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { MailState } from '@mails/mail-state';
import { MailsService } from '@mails/services/mails.service';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay } from 'rxjs/operators';

import { ProfileBgHeroStat, ProfileClassProgress } from '@firestone-hs/api-user-profile';
import { PackResult } from '@firestone-hs/user-packs';
import { PackInfo } from '@firestone/collection/view';
import { DeckSummary } from '@firestone/constructed/common';
import { BattlegroundsState, GameState } from '@firestone/game-state';
import { Card, CardBack } from '@firestone/memory';
import { PatchesConfigService, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AchievementHistory } from '../../models/achievement/achievement-history';
import { CardHistory } from '../../models/card-history';
import { Coin } from '../../models/coin';
import { BattlegroundsAppState } from '../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { MercenariesBattleState } from '../../models/mercenaries/mercenaries-battle-state';
import { MercenariesOutOfCombatState } from '../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { Set } from '../../models/set';
import { AchievementHistoryService } from '../achievement/achievements-history.service';
import {
	AchievementsLiveProgressTrackingService,
	AchievementsProgressTracking,
} from '../achievement/achievements-live-progress-tracking.service';
import { AchievementsStateManagerService } from '../achievement/achievements-state-manager.service';
import { CollectionManager } from '../collection/collection-manager.service';
import { SetsManagerService } from '../collection/sets-manager.service';
import { DecksProviderService } from '../decktracker/main/decks-provider.service';
import { LotteryWidgetControllerService } from '../lottery/lottery-widget-controller.service';
import { LotteryState } from '../lottery/lottery.model';
import { LotteryService } from '../lottery/lottery.service';
import { CollectionBootstrapService } from '../mainwindow/store/collection-bootstrap.service';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { HighlightSelector } from '../mercenaries/highlights/mercenaries-synergies-highlight.service';
import { GameStatsProviderService } from '../stats/game/game-stats-provider.service';
import { arraysEqual } from '../utils';

export type Selector<T> = (fullState: [MainWindowState, NavigationState, Preferences?]) => T;
export type GameStatsSelector<T> = (stats: readonly GameStat[]) => T;
export type GameStateSelector<T> = (gameState: GameState) => T;
export type BattlegroundsStateSelector<T> = (state: [BattlegroundsState, Preferences?]) => T;
export type MercenariesStateSelector<T> = (state: [MercenariesBattleState, Preferences?]) => T;
export type MercenariesOutOfCombatStateSelector<T> = (state: [MercenariesOutOfCombatState, Preferences?]) => T;
export type MercenariesHighlightsSelector<T> = (state: [HighlightSelector, Preferences?]) => T;

@Injectable()
export class AppUiStoreService extends Store<Preferences> {
	public eventBus$$ = new BehaviorSubject<StoreEvent>(null);

	private mainStore: BehaviorSubject<[MainWindowState, NavigationState]>;
	private prefs: BehaviorSubject<Preferences>;
	private deckStore: BehaviorSubject<GameState>;
	private battlegroundsStore: BehaviorSubject<BattlegroundsState>;
	private mercenariesStore: BehaviorSubject<MercenariesBattleState>;
	private mercenariesOutOfCombatStore: BehaviorSubject<MercenariesOutOfCombatState>;
	private mercenariesSynergiesStore: BehaviorSubject<HighlightSelector>;

	private gameStats: Observable<readonly GameStat[]>;
	private decks: Observable<readonly DeckSummary[]>;
	private mails: Observable<MailState>;
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
	private achievementsHistory: BehaviorSubject<readonly AchievementHistory[]>;
	private packStats: Observable<readonly PackResult[]>;
	private cardHistory: Observable<readonly CardHistory[]>;
	private profileClassesProgress: Observable<readonly ProfileClassProgress[]>;
	private profileBgHeroStat: Observable<readonly ProfileBgHeroStat[]>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	private initialized = false;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly prefsService: PreferencesService,
		private readonly decksProvider: DecksProviderService,
		private readonly gameStatsProvider: GameStatsProviderService,
		private readonly collectionManager: CollectionManager,
		private readonly collectionBootstrapService: CollectionBootstrapService,
		private readonly setsManager: SetsManagerService,
		private readonly achievementsStateManagerService: AchievementsStateManagerService,
	) {
		super();
		window['appStore'] = this;
	}

	// WARNING: All services used here should be called in BootstrapStoreServicesService to make sure they are booted up
	// This is called after all constructors have been called, so everything should be filled
	public async start() {
		await this.prefsService.isReady();
		await this.decksProvider.isReady();
		await this.gameStatsProvider.isReady();
		await this.collectionManager.isReady();
		await this.collectionBootstrapService.isReady();
		await this.setsManager.isReady();

		this.mainStore = this.ow.getMainWindow().mainWindowStoreMerged;
		this.prefs = this.prefsService.preferences$$;
		this.deckStore = this.ow.getMainWindow().deckEventBus;
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

	public listenDeckState$<S extends GameStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends GameStateSelector<infer T> ? T : never }> {
		return this.deckStore.pipe(
			filter((gameState) => !!gameState),
			map((gameState) => selectors.map((selector) => selector(gameState))),
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

	public gameStats$(): Observable<readonly GameStat[]> {
		return this.gameStats;
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

	public decks$(): Observable<readonly DeckSummary[]> {
		return this.decks;
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

	public profileBgHeroStat$(): Observable<readonly ProfileBgHeroStat[]> {
		return this.profileBgHeroStat;
	}

	public achievementsHistory$(): Observable<readonly AchievementHistory[]> {
		return this.achievementsHistory;
	}

	public packStats$(): Observable<readonly PackResult[]> {
		return this.packStats;
	}

	public cardHistory$(): Observable<readonly CardHistory[]> {
		return this.cardHistory;
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
		// The rest
		this.initDecks();
		this.initMails();
		this.initCardBacks();
		this.initCoins();
		this.initCollection();
		this.initBgHeroSkins();
		this.initSets();
		this.initAllTimeBoosters();
		this.initShouldTrackLottery();
		this.initShouldShowLotteryOverlay();
		this.initLottery();
		this.initAchievementsProgressTracking();
		this.initProfileClassProgress();
		this.initProfileBgHeroStat();
		this.achievementsHistory = (
			this.ow.getMainWindow().achievementsHistory as AchievementHistoryService
		).achievementsHistory$$;
		this.initPackStats();
		this.initCardsHistory();
		this.initialized = true;
	}

	private initAllTimeBoosters() {
		this.allTimeBoosters = this.collectionManager.allTimeBoosters$$.asObservable();
	}

	private initSets() {
		this.sets = this.setsManager.sets$$;
	}

	private initBgHeroSkins() {
		this.bgHeroSkins = this.collectionManager.bgHeroSkins$$.asObservable();
	}

	private initCollection() {
		this.collection = this.collectionManager.collection$$.asObservable();
	}

	private initCoins() {
		this.coins = this.collectionManager.coins$$.asObservable();
	}

	private initCardBacks() {
		this.cardBacks = this.collectionManager.cardBacks$$.asObservable();
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

	private initProfileBgHeroStat() {
		this.profileBgHeroStat = this.ow.getMainWindow().profileBgHeroStat as BehaviorSubject<
			readonly ProfileBgHeroStat[]
		>;
	}

	private initPackStats() {
		this.packStats = this.collectionBootstrapService.packStats$$;
	}

	private initCardsHistory() {
		this.cardHistory = this.collectionBootstrapService.cardHistory$$;
	}

	private initDecks() {
		this.decks = this.decksProvider.decks$$;
	}

	private initGameStats() {
		this.gameStats = this.gameStatsProvider.gameStats$$;
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
