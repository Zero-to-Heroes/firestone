import { EventEmitter, Injectable } from '@angular/core';
import { DuelsHeroStat } from '@firestone-hs/duels-global-stats/dist/stat';
import { ALL_BG_RACES } from '@firestone-hs/reference-data';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import {
	BgsMetaHeroStatTierItem,
	buildHeroStats,
	enhanceHeroStat,
} from '@legacy-import/src/lib/js/services/battlegrounds/bgs-meta-hero-stats';
import { ModsConfig } from '@legacy-import/src/lib/libs/mods/model/mods-config';
import { MailState } from '@mails/mail-state';
import { MailsService } from '@mails/services/mails.service';
import { DuelsGroupedDecks } from '@models/duels/duels-grouped-decks';
import { DuelsHeroPlayerStat } from '@models/duels/duels-player-stats';
import { DuelsRun } from '@models/duels/duels-run';
import { DuelsStatTypeFilterType } from '@models/duels/duels-stat-type-filter.type';
import {
	buildDuelsHeroPlayerStats,
	filterDuelsHeroStats,
	filterDuelsRuns,
	getDuelsMmrFilterNumber,
	topDeckApplyFilters,
} from '@services/ui-store/duels-ui-helper';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { TavernBrawlService } from '../../../libs/tavern-brawl/services/tavern-brawl.service';
import { TavernBrawlState } from '../../../libs/tavern-brawl/tavern-brawl-state';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { BgsHeroStat } from '../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { GameState } from '../../models/decktracker/game-state';
import { DuelsDeckSummary } from '../../models/duels/duels-personal-deck';
import { BattlegroundsAppState } from '../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BgsActiveTimeFilterType } from '../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { BgsHeroSortFilterType } from '../../models/mainwindow/battlegrounds/bgs-hero-sort-filter.type';
import { BgsRankFilterType } from '../../models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { DeckSummary } from '../../models/mainwindow/decktracker/deck-summary';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { MercenariesBattleState } from '../../models/mercenaries/mercenaries-battle-state';
import { MercenariesOutOfCombatState } from '../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { PatchInfo } from '../../models/patches';
import { Preferences } from '../../models/preferences';
import { isBattlegrounds } from '../battlegrounds/bgs-utils';
import { DecksProviderService } from '../decktracker/main/decks-provider.service';
import { DuelsDecksProviderService } from '../duels/duels-decks-provider.service';
import { GameNativeState } from '../game/game-native-state';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { HighlightSelector } from '../mercenaries/highlights/mercenaries-synergies-highlight.service';
import { GameStatsProviderService } from '../stats/game/game-stats-provider.service';
import { arraysEqual } from '../utils';
import { buildHeroStats as buildHeroStatsOld, filterBgsMatchStats } from './bgs-ui-helper';

export type Selector<T> = (fullState: [MainWindowState, NavigationState, Preferences?]) => T;
export type GameStatsSelector<T> = (stats: readonly GameStat[]) => T;
export type GameStateSelector<T> = (gameState: GameState) => T;
export type PrefsSelector<T> = (prefs: Preferences) => T;
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
export class AppUiStoreService {
	private mainStore: BehaviorSubject<[MainWindowState, NavigationState]>;
	private gameNativeState: BehaviorSubject<GameNativeState>;
	private prefs: BehaviorSubject<{ name: string; preferences: Preferences }>;
	private deckStore: BehaviorSubject<{ state: GameState }>;
	private battlegroundsStore: BehaviorSubject<BattlegroundsState>;
	private mercenariesStore: BehaviorSubject<MercenariesBattleState>;
	private mercenariesOutOfCombatStore: BehaviorSubject<MercenariesOutOfCombatState>;
	private mercenariesSynergiesStore: BehaviorSubject<HighlightSelector>;
	private modsConfig: BehaviorSubject<ModsConfig>;

	/** @deprecated */
	private bgsHeroStats = new BehaviorSubject<readonly BgsHeroStat[]>(null);
	private bgsMetaStatsHero = new BehaviorSubject<readonly BgsMetaHeroStatTierItem[]>(null);
	private duelsHeroStats = new BehaviorSubject<readonly DuelsHeroPlayerStat[]>(null);
	private duelsTopDecks = new BehaviorSubject<readonly DuelsGroupedDecks[]>(null);
	private gameStats = new BehaviorSubject<readonly GameStat[]>(null);
	private decks = new BehaviorSubject<readonly DeckSummary[]>(null);
	private duelsRuns = new BehaviorSubject<readonly DuelsRun[]>(null);
	private duelsDecks = new BehaviorSubject<readonly DuelsDeckSummary[]>(null);
	private mails = new BehaviorSubject<MailState>(null);
	private tavernBrawl = new BehaviorSubject<TavernBrawlState>(null);

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	private initialized = false;

	constructor(private readonly ow: OverwolfService, private readonly allCards: CardsFacadeService) {
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
				bgsHeroStats: this.bgsHeroStats.observers,
				bgsMetaStatsHero: this.bgsMetaStatsHero.observers,
				duelsHeroStats: this.duelsHeroStats.observers,
				duelsTopDecks: this.duelsTopDecks.observers,
				gameStats: this.gameStats.observers,
				decks: this.decks.observers,
				duelsRuns: this.duelsRuns.observers,
				duelsDecks: this.duelsDecks.observers,
				mails: this.mails.observers,
				tavernBrawl: this.tavernBrawl.observers,
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

	public listenPrefs$<S extends PrefsSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends PrefsSelector<infer T> ? T : never }> {
		this.debugCall('listenPrefs$');
		return this.prefs.pipe(
			filter((prefs) => !!prefs?.preferences),
			map((prefs) => selectors.map((selector) => selector(prefs.preferences))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends PrefsSelector<infer T> ? T : never }>;
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

	public bgHeroStats$(): Observable<readonly BgsHeroStat[]> {
		this.debugCall('bgHeroStats$');
		return this.bgsHeroStats.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public bgsMetaStatsHero$(): Observable<readonly BgsMetaHeroStatTierItem[]> {
		this.debugCall('bgHeroStats$');
		return this.bgsMetaStatsHero.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public duelsHeroStats$(): Observable<readonly DuelsHeroPlayerStat[]> {
		this.debugCall('duelsHeroStats$');
		return this.duelsHeroStats.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public duelsTopDecks$(): Observable<readonly DuelsGroupedDecks[]> {
		this.debugCall('duelsTopDecks$');
		return this.duelsTopDecks.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
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

	public mails$(): Observable<MailState> {
		this.debugCall('mails$');
		return this.mails.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public tavernBrawl$(): Observable<TavernBrawlState> {
		this.debugCall('tavernBrawl$');
		return this.tavernBrawl.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public decks$(): Observable<readonly DeckSummary[]> {
		this.debugCall('decks$');
		return this.decks.pipe(distinctUntilChanged((a, b) => arraysEqual(a, b)));
	}

	public send(event: MainWindowStoreEvent) {
		this.stateUpdater.next(event);
	}

	// TODO: this probably makes more sense in a facade. I'll move it when more methods like this
	// start appearing
	private init() {
		this.initBgsHeroStats();
		this.initBgsMetaStatsHero();
		this.initDuelsHeroStats();
		this.initDuelsTopDecks();
		this.initGameStats();
		this.initDecks();
		this.initDuelsRuns();
		this.initDuelsDecks();
		this.initMails();
		this.initTavernBrawl();
		this.initialized = true;
	}

	private initTavernBrawl() {
		const tavernBrawl: BehaviorSubject<TavernBrawlState> = (
			this.ow.getMainWindow().tavernBrawlProvider as TavernBrawlService
		).tavernBrawl$;
		tavernBrawl.subscribe(this.tavernBrawl);
	}

	private initMails() {
		const mails: BehaviorSubject<MailState> = (this.ow.getMainWindow().mailsProvider as MailsService).mails$;
		mails.subscribe(this.mails);
	}

	private initDuelsDecks() {
		const duelsDecks: BehaviorSubject<readonly DuelsDeckSummary[]> = (
			this.ow.getMainWindow().duelsDecksProvider as DuelsDecksProviderService
		).duelsDecks$;
		duelsDecks.subscribe(this.duelsDecks);
	}

	private initDuelsRuns() {
		const duelsRuns: BehaviorSubject<readonly DuelsRun[]> = (
			this.ow.getMainWindow().duelsDecksProvider as DuelsDecksProviderService
		).duelsRuns$;
		duelsRuns.subscribe(this.duelsRuns);
	}

	private initDecks() {
		const decks$: BehaviorSubject<readonly DeckSummary[]> = (
			this.ow.getMainWindow().decksProvider as DecksProviderService
		).decks$;
		decks$.subscribe(this.decks);
	}

	private initGameStats() {
		const gameStats$: BehaviorSubject<readonly GameStat[]> = (
			this.ow.getMainWindow().gameStatsProvider as GameStatsProviderService
		).gameStats$;
		gameStats$.subscribe(this.gameStats);
	}

	private initDuelsTopDecks() {
		this.listen$(
			([main, nav]) => main.duels.topDecks,
			([main, nav]) => main.duels.globalStats?.mmrPercentiles,
			([main, nav, prefs]) => prefs.duelsActiveMmrFilter,
			([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
			([main, nav, prefs]) => prefs.duelsActiveHeroPowerFilter,
			([main, nav, prefs]) => prefs.duelsActiveSignatureTreasureFilter,
			([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
			([main, nav, prefs]) => prefs.duelsActiveTopDecksDustFilter,
			([main, nav, prefs]) => prefs.duelsActivePassiveTreasuresFilter,
			([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
		)
			.pipe(
				filter(([topDecks, mmrPercentiles]) => !!topDecks?.length && !!mmrPercentiles?.length),
				map(
					([
						topDecks,
						mmrPercentiles,
						mmrFilter,
						classFilter,
						heroPowerFilter,
						sigTreasureFilter,
						timeFilter,
						dustFilter,
						passivesFilter,
						patch,
					]) => {
						const trueMmrFilter = getDuelsMmrFilterNumber(mmrPercentiles, mmrFilter);
						const result = topDecks
							.map((deck) =>
								topDeckApplyFilters(
									deck,
									trueMmrFilter,
									classFilter,
									heroPowerFilter,
									sigTreasureFilter,
									timeFilter,
									dustFilter,
									passivesFilter,
									patch,
								),
							)
							.filter((group) => group.decks.length > 0);
						return result;
					},
				),
			)
			.subscribe((stats) => this.duelsTopDecks.next(stats));
	}

	private initDuelsHeroStats() {
		combineLatest(
			this.duelsRuns$(),
			this.listen$(
				([main, nav]) => main.duels.globalStats?.heroes,
				([main, nav]) => nav.navigationDuels.heroSearchString,
				([main, nav, prefs]) => prefs.duelsActiveStatTypeFilter,
				([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
				([main, nav, prefs]) => prefs.duelsActiveHeroPowerFilter,
				([main, nav, prefs]) => prefs.duelsActiveSignatureTreasureFilter,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
			),
		)
			.pipe(
				filter(([duelsRuns, [heroes, other]]) => !!heroes?.length),
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
			)
			.subscribe((stats) => this.duelsHeroStats.next(stats));
	}

	private initBgsMetaStatsHero() {
		const statsWithOnlyGlobalData$ = combineLatest([
			this.listen$(([main]) => main.battlegrounds.getMetaHeroStats()),
			this.listenPrefs$(
				(prefs) => prefs.bgsActiveRankFilter,
				(prefs) => prefs.bgsActiveTribesFilter,
			),
		]).pipe(
			map(([[stats], [bgsActiveRankFilter, bgsActiveTribesFilter]]) => {
				console.debug('showing meta hero stats', stats);
				const result: readonly BgsMetaHeroStatTierItem[] = buildHeroStats(
					stats?.heroStats,
					bgsActiveRankFilter,
					bgsActiveTribesFilter,
				);
				console.debug('built global stats', result);
				return result;
			}),
		);

		const playerBgGames$ = combineLatest([
			this.gameStats$(),
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
			distinctUntilChanged(),
			map(([games, [mmrPercentiles, patchInfo], [rankFilter, tribesFilter, timeFilter]]) => {
				const targetRank: number =
					!mmrPercentiles?.length || !rankFilter
						? 0
						: mmrPercentiles.find((m) => m.percentile === rankFilter)?.mmr ?? 0;
				console.debug('targetRank', targetRank);
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
			distinctUntilChanged(),
		);

		const enhancedStats$ = combineLatest([statsWithOnlyGlobalData$, playerBgGames$]).pipe(
			map(([stats, playerBgGames]) => stats.map((stat) => enhanceHeroStat(stat, playerBgGames, this.allCards))),
		);

		enhancedStats$.subscribe(this.bgsMetaStatsHero$);
	}

	/** @deprecated */
	private initBgsHeroStats() {
		combineLatest(
			this.gameStats$(),
			this.listen$(
				([main, nav]) => main.battlegrounds.globalStats,
				([main, nav, prefs]) => prefs.bgsActiveTimeFilter,
				([main, nav, prefs]) => prefs.bgsActiveRankFilter,
				([main, nav, prefs]) => prefs.bgsActiveHeroSortFilter,
				([main, nav]) => main.battlegrounds.currentBattlegroundsMetaPatch,
			),
		)
			.pipe(
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(
					([gameStats, [stats, timeFilter, rankFilter, heroSort, patch]]) =>
						[
							stats,
							gameStats?.filter(
								(stat) =>
									stat.gameMode === 'battlegrounds' || stat.gameMode === 'battlegrounds-friendly',
							) ?? [],
							timeFilter,
							rankFilter <= 100 ? rankFilter : 100,
							heroSort,
							patch,
						] as readonly [
							BgsStats,
							readonly GameStat[],
							BgsActiveTimeFilterType,
							BgsRankFilterType,
							BgsHeroSortFilterType,
							PatchInfo,
						],
				),
				// Do two steps, so that if we're playing constructed nothing triggers here
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(([stats, matches, timeFilter, rankFilter, heroSort, patch]) => {
					return buildHeroStatsOld(stats, matches, timeFilter, rankFilter, heroSort, patch, this.allCards);
				}),
			)
			.subscribe((stats) => this.bgsHeroStats.next(stats));
	}

	private debugCall(...args) {
		return;
		console.debug('[store]', args, new Error());
	}
}

export const currentBgHeroId = (battlegrounds: BattlegroundsAppState, selectedCategoryId: string): string => {
	return selectedCategoryId?.includes('bgs-category-personal-hero-details-')
		? (battlegrounds.findCategory(selectedCategoryId) as BattlegroundsPersonalStatsHeroDetailsCategory)?.heroId
		: null;
};

export const cdLog = (...args) => {
	if (process.env.NODE_ENV !== 'production') {
		// console.debug('[cd]', ...args);
	}
};
