import { EventEmitter, Injectable } from '@angular/core';
import { DuelsHeroStat } from '@firestone-hs/duels-global-stats/dist/stat';
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
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { BgsHeroStat } from '../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../models/battlegrounds/stats/bgs-stats';
import { GameState } from '../../models/decktracker/game-state';
import { BattlegroundsAppState } from '../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BgsActiveTimeFilterType } from '../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { BgsHeroSortFilterType } from '../../models/mainwindow/battlegrounds/bgs-hero-sort-filter.type';
import { BgsRankFilterType } from '../../models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { MainWindowState } from '../../models/mainwindow/main-window-state';
import { NavigationState } from '../../models/mainwindow/navigation/navigation-state';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { MercenariesBattleState } from '../../models/mercenaries/mercenaries-battle-state';
import { MercenariesOutOfCombatState } from '../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import { PatchInfo } from '../../models/patches';
import { Preferences } from '../../models/preferences';
import { CardsFacadeService } from '../cards-facade.service';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { HighlightSelector } from '../mercenaries/highlights/mercenaries-synergies-highlight.service';
import { OverwolfService } from '../overwolf.service';
import { arraysEqual } from '../utils';
import { buildHeroStats } from './bgs-ui-helper';

export type Selector<T> = (fullState: [MainWindowState, NavigationState, Preferences?]) => T;
export type GameStateSelector<T> = (gameState: GameState) => T;
export type PrefsSelector<T> = (prefs: Preferences) => T;
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
	private prefs: BehaviorSubject<{ name: string; preferences: Preferences }>;
	private deckStore: BehaviorSubject<{ state: GameState }>;
	private battlegroundsStore: BehaviorSubject<BattlegroundsState>;
	private mercenariesStore: BehaviorSubject<MercenariesBattleState>;
	private mercenariesOutOfCombatStore: BehaviorSubject<MercenariesOutOfCombatState>;
	private mercenariesSynergiesStore: BehaviorSubject<HighlightSelector>;

	private bgsHeroStats: BehaviorSubject<readonly BgsHeroStat[]> = new BehaviorSubject<readonly BgsHeroStat[]>(null);
	private duelsHeroStats: BehaviorSubject<readonly DuelsHeroPlayerStat[]> = new BehaviorSubject<
		readonly DuelsHeroPlayerStat[]
	>(null);
	private duelsTopDecks: BehaviorSubject<readonly DuelsGroupedDecks[]> = new BehaviorSubject<
		readonly DuelsGroupedDecks[]
	>(null);

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	private initialized = false;

	constructor(private readonly ow: OverwolfService, private allCards: CardsFacadeService) {
		window['appStore'] = this;
		window['debugAppStore'] = () =>
			console.debug({
				mainStore: this.mainStore.observers,
				prefs: this.prefs.observers,
				deckStore: this.deckStore.observers,
				battlegroundsStore: this.battlegroundsStore.observers,
				mercenariesStore: this.mercenariesStore.observers,
				mercenariesOutOfCombatStore: this.mercenariesOutOfCombatStore.observers,
				mercenariesSynergiesStore: this.mercenariesSynergiesStore.observers,
				bgsHeroStats: this.bgsHeroStats.observers,
				duelsHeroStats: this.duelsHeroStats.observers,
				duelsTopDecks: this.duelsTopDecks.observers,
			});
	}

	// This is called after all constructors have been called, so everything should be filled
	public start() {
		this.mainStore = this.ow.getMainWindow().mainWindowStoreMerged;
		this.prefs = this.ow.getMainWindow().preferencesEventBus;
		this.deckStore = this.ow.getMainWindow().deckEventBus;
		this.battlegroundsStore = this.ow.getMainWindow().battlegroundsStore;
		this.mercenariesStore = this.ow.getMainWindow().mercenariesStore;
		this.mercenariesOutOfCombatStore = this.ow.getMainWindow().mercenariesOutOfCombatStore;
		this.mercenariesSynergiesStore = this.ow.getMainWindow().mercenariesSynergiesStore;
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;

		if (
			!this.mainStore ||
			!this.prefs ||
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
		return combineLatest(this.mainStore.asObservable(), this.prefs.asObservable()).pipe(
			filter(([[main, nav], prefs]) => !!main && !!nav && !!prefs?.preferences),
			// tap(([[main, nav], prefs]) => console.debug('emitting', [main, nav, prefs?.preferences], this)),
			map(([[main, nav], prefs]) => selectors.map((selector) => selector([main, nav, prefs?.preferences]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends Selector<infer T> ? T : never }>;
	}

	public listenPrefs$<S extends PrefsSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends PrefsSelector<infer T> ? T : never }> {
		return this.prefs.asObservable().pipe(
			filter((prefs) => !!prefs?.preferences),
			// tap((gameState) => console.debug('emitting gameState', gameState, this)),
			map((prefs) => selectors.map((selector) => selector(prefs.preferences))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends PrefsSelector<infer T> ? T : never }>;
	}

	public listenDeckState$<S extends GameStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends GameStateSelector<infer T> ? T : never }> {
		return this.deckStore.asObservable().pipe(
			filter((gameState) => !!gameState),
			// tap((gameState) => console.debug('emitting gameState', gameState, this)),
			map((gameState) => selectors.map((selector) => selector(gameState.state))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends GameStateSelector<infer T> ? T : never }>;
	}

	public listenBattlegrounds$<S extends BattlegroundsStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends BattlegroundsStateSelector<infer T> ? T : never }> {
		return combineLatest(this.battlegroundsStore.asObservable(), this.prefs.asObservable()).pipe(
			filter(([state, prefs]) => !!state && !!prefs?.preferences),
			map(([state, prefs]) => selectors.map((selector) => selector([state, prefs.preferences]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends BattlegroundsStateSelector<infer T> ? T : never }>;
	}

	public listenMercenaries$<S extends MercenariesStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesStateSelector<infer T> ? T : never }> {
		return combineLatest(this.mercenariesStore.asObservable(), this.prefs.asObservable()).pipe(
			filter(([state, prefs]) => !!prefs?.preferences),
			map(([state, prefs]) => selectors.map((selector) => selector([state, prefs]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends MercenariesStateSelector<infer T> ? T : never }>;
	}

	public listenMercenariesOutOfCombat$<S extends MercenariesOutOfCombatStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesOutOfCombatStateSelector<infer T> ? T : never }> {
		return combineLatest(this.mercenariesOutOfCombatStore.asObservable(), this.prefs.asObservable()).pipe(
			filter(([state, prefs]) => !!state && !!prefs?.preferences),
			map(([state, prefs]) => selectors.map((selector) => selector([state, prefs]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends MercenariesOutOfCombatStateSelector<infer T> ? T : never }>;
	}

	public listenMercenariesHighlights$<S extends MercenariesHighlightsSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesHighlightsSelector<infer T> ? T : never }> {
		return combineLatest(this.mercenariesSynergiesStore.asObservable(), this.prefs.asObservable()).pipe(
			filter(([highlights, prefs]) => !!prefs?.preferences),
			map(([highlights, prefs]) => selectors.map((selector) => selector([highlights, prefs]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends MercenariesHighlightsSelector<infer T> ? T : never }>;
	}

	public bgHeroStats$(): Observable<readonly BgsHeroStat[]> {
		return this.bgsHeroStats.asObservable().pipe(
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			// tap((all) => console.debug('[cd] reemitting info for bgsHeroStats$', all)),
		);
	}

	public duelsHeroStats$(): Observable<readonly DuelsHeroPlayerStat[]> {
		return this.duelsHeroStats.asObservable().pipe(
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			// tap((all) => console.debug('[cd] reemitting info for bgsHeroStats$', all)),
		);
	}

	public duelsTopDecks$(): Observable<readonly DuelsGroupedDecks[]> {
		return this.duelsTopDecks.asObservable().pipe(
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			// tap((all) => console.debug('[cd] reemitting info for bgsHeroStats$', all)),
		);
	}

	public send(event: MainWindowStoreEvent) {
		this.stateUpdater.next(event);
	}

	// TODO: this probably makes more sense in a facade. I'll move it when more methods like this
	// start appearing
	private init() {
		this.initBgsHeroStats();
		this.initDuelsHeroStats();
		this.initDuelsTopDecks();
		this.initialized = true;
	}

	private initDuelsTopDecks() {
		this.listen$(
			([main, nav]) => main.duels.topDecks,
			([main, nav]) => main.duels.globalStats?.mmrPercentiles,
			([main, nav]) => main.duels.adventuresInfo,
			([main, nav, prefs]) => prefs.duelsActiveMmrFilter,
			([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
			([main, nav, prefs]) => prefs.duelsActiveHeroPowerFilter,
			([main, nav, prefs]) => prefs.duelsActiveSignatureTreasureFilter,
			([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
			([main, nav, prefs]) => prefs.duelsActiveTopDecksDustFilter,
			([main, nav, prefs]) => prefs.duelsFilterOutLockedRequirements,
			([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
		)
			.pipe(
				filter(([topDecks, mmrPercentiles]) => !!topDecks?.length && !!mmrPercentiles?.length),
				map(
					([
						topDecks,
						mmrPercentiles,
						adventuresInfo,
						mmrFilter,
						classFilter,
						heroPowerFilter,
						sigTreasureFilter,
						timeFilter,
						dustFilter,
						lockFilter,
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
									patch,
									adventuresInfo,
									lockFilter,
									this.allCards,
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
		this.listen$(
			([main, nav]) => main.duels.globalStats?.heroes,
			([main, nav]) => main.duels.runs,
			([main, nav]) => nav.navigationDuels.heroSearchString,
			([main, nav, prefs]) => prefs.duelsActiveStatTypeFilter,
			([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
			([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
			([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
			([main, nav, prefs]) => prefs.duelsActiveHeroPowerFilter,
			([main, nav, prefs]) => prefs.duelsActiveSignatureTreasureFilter,
			([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
		)
			.pipe(
				filter(([heroes, other]) => !!heroes?.length),
				map(
					([
						duelStats,
						runs,
						heroSearchString,
						statType,
						gameMode,
						timeFilter,
						heroFilter,
						heroPowerFilter,
						sigTreasureFilter,
						patch,
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
				// tap((info) => console.debug('ready for duels hero stats', info)),
				map(([duelStats, duelsRuns, statType]) => buildDuelsHeroPlayerStats(duelStats, statType, duelsRuns)),
				// tap((info) => console.debug('after duels hero stats', info)),
			)
			.subscribe((stats) => this.duelsHeroStats.next(stats));
	}

	private initBgsHeroStats() {
		this.listen$(
			([main, nav]) => main.battlegrounds.globalStats,
			([main, nav]) => main.stats.gameStats?.stats,
			([main, nav, prefs]) => prefs.bgsActiveTimeFilter,
			([main, nav, prefs]) => prefs.bgsActiveRankFilter,
			([main, nav, prefs]) => prefs.bgsActiveHeroSortFilter,
			([main, nav]) => main.battlegrounds.currentBattlegroundsMetaPatch,
		)
			.pipe(
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				map(
					([stats, matches, timeFilter, rankFilter, heroSort, patch]) =>
						[
							stats,
							matches.filter((stat) => stat.gameMode === 'battlegrounds'),
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
					return buildHeroStats(stats, matches, timeFilter, rankFilter, heroSort, patch, this.allCards);
				}),
				// tap((all) => console.debug('[cd] populating bgsHeroStats internal behavior subject')),
			)
			.subscribe((stats) => this.bgsHeroStats.next(stats));
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
