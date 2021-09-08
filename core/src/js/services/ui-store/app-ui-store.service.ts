import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
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
import { PatchInfo } from '../../models/patches';
import { Preferences } from '../../models/preferences';
import { CardsFacadeService } from '../cards-facade.service';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../overwolf.service';
import { arraysEqual } from '../utils';
import { buildHeroStats, filterBgsMatchStats } from './bgs-ui-helper';

type Selector<T> = (fullState: [MainWindowState, NavigationState, Preferences?]) => T;
type GameStateSelector<T> = (gameState: GameState) => T;
type BattlegroundsStateSelector<T> = (state: [BattlegroundsState, Preferences?]) => T;

@Injectable()
export class AppUiStoreService {
	private mainStore: BehaviorSubject<[MainWindowState, NavigationState]>;
	private prefs: BehaviorSubject<{ name: string; preferences: Preferences }>;
	private deckStore: BehaviorSubject<{ state: GameState }>;
	private battlegroundsStore: BehaviorSubject<BattlegroundsState>;

	private bgsHeroStats: BehaviorSubject<readonly BgsHeroStat[]> = new BehaviorSubject<readonly BgsHeroStat[]>(null);

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private allCards: CardsFacadeService) {
		this.mainStore = this.ow.getMainWindow()?.mainWindowStoreMerged;
		this.prefs = this.ow.getMainWindow()?.preferencesEventBus;
		this.deckStore = this.ow.getMainWindow().deckEventBus;
		this.battlegroundsStore = this.ow.getMainWindow().battlegroundsStore;
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;

		this.init();
	}

	// Selectors here should do minimal work - just select the data from the state, and not
	// perform any mapping.
	// This is because the selectors are called every time a new state is emitted, so
	// costly operations can still amount to a lot of overhead
	public listen$<S extends Selector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends Selector<infer T> ? T : never }> {
		return combineLatest(this.mainStore.asObservable(), this.prefs.asObservable()).pipe(
			// tap(([[main, nav], prefs]) => console.debug('emitting', [main, nav, prefs?.preferences], this)),
			map(([[main, nav], prefs]) => selectors.map((selector) => selector([main, nav, prefs?.preferences]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends Selector<infer T> ? T : never }>;
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
			// tap((gameState) => console.debug('emitting bg state', gameState, this)),
			map(([state, prefs]) => selectors.map((selector) => selector([state, prefs.preferences]))),
			// tap((hop) => console.debug('emitting bg state after selectors', hop, this)),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends BattlegroundsStateSelector<infer T> ? T : never }>;
	}

	public bgHeroStats$(): Observable<readonly BgsHeroStat[]> {
		return this.bgsHeroStats.asObservable().pipe(
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			tap((all) => console.debug('[cd] reemitting info for bgsHeroStats$', all)),
		);
	}

	public send(event: MainWindowStoreEvent) {
		this.stateUpdater.next(event);
	}

	// TODO: this probably makes more sense in a facade. I'll move it when more methods like this
	// start appearing
	private init() {
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
							rankFilter,
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
					const bgMatches = filterBgsMatchStats(matches, timeFilter, rankFilter, patch);
					return buildHeroStats(stats, bgMatches, this.allCards, heroSort);
				}),
				tap((all) => console.debug('[cd] populating internal behavior subject', all)),
			)
			.subscribe((stats) => this.bgsHeroStats.next(stats));
	}
}

export const currentBgHeroId = (battlegrounds: BattlegroundsAppState, selectedCategoryId: string): string => {
	return selectedCategoryId?.includes('bgs-category-personal-hero-details-')
		? (battlegrounds.findCategory(selectedCategoryId) as BattlegroundsPersonalStatsHeroDetailsCategory)?.heroId
		: null;
};

export const cdLog = (...args) => console.debug('[cd]', ...args);
