import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';
import { GameState } from '../models/decktracker/game-state';
import { BattlegroundsAppState } from '../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { MainWindowState } from '../models/mainwindow/main-window-state';
import { NavigationState } from '../models/mainwindow/navigation/navigation-state';
import { Preferences } from '../models/preferences';
import { MainWindowStoreEvent } from './mainwindow/store/events/main-window-store-event';
import { OverwolfService } from './overwolf.service';
import { arraysEqual } from './utils';

type Selector<T> = (fullState: [MainWindowState, NavigationState, Preferences?]) => T;
type GameStateSelector<T> = (gameState: GameState) => T;

@Injectable()
export class AppUiStoreService {
	private mainStore: BehaviorSubject<[MainWindowState, NavigationState]>;
	private prefs: BehaviorSubject<{ name: string; preferences: Preferences }>;
	private deckStore: BehaviorSubject<{ state: GameState }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private zone: NgZone) {
		this.mainStore = this.ow.getMainWindow()?.mainWindowStoreMerged;
		this.prefs = this.ow.getMainWindow()?.preferencesEventBus;
		this.deckStore = this.ow.getMainWindow().deckEventBus;
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
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
	): Observable<{ [K in keyof S]: S[K] extends Selector<infer T> ? T : never }> {
		return this.deckStore.asObservable().pipe(
			tap((gameState) => console.debug('emitting gameState', gameState, this)),
			map((gameState) => selectors.map((selector) => selector(gameState.state))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends Selector<infer T> ? T : never }>;
	}

	public send(event: MainWindowStoreEvent) {
		this.stateUpdater.next(event);
	}
}

export const currentBgHeroId = (battlegrounds: BattlegroundsAppState, selectedCategoryId: string): string => {
	return selectedCategoryId?.includes('bgs-category-personal-hero-details-')
		? (battlegrounds.findCategory(selectedCategoryId) as BattlegroundsPersonalStatsHeroDetailsCategory)?.heroId
		: null;
};

export const cdLog = (...args) => console.debug('[cd]', ...args);
