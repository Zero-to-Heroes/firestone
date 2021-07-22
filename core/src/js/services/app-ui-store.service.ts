import { EventEmitter, Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { MainWindowState } from '../models/mainwindow/main-window-state';
import { NavigationState } from '../models/mainwindow/navigation/navigation-state';
import { Preferences } from '../models/preferences';
import { MainWindowStoreEvent } from './mainwindow/store/events/main-window-store-event';
import { OverwolfService } from './overwolf.service';
import { arraysEqual } from './utils';

type Selector<T> = (fullState: [MainWindowState, NavigationState, Preferences?]) => T;

@Injectable()
export class AppUiStoreService {
	private mainStore: BehaviorSubject<[MainWindowState, NavigationState]>;
	// private prefs$: Observable<Preferences>;
	private prefs: BehaviorSubject<{ name: string; preferences: Preferences }>;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private zone: NgZone) {
		this.mainStore = this.ow.getMainWindow()?.mainWindowStoreMerged;
		// const prefsSubject: BehaviorSubject<Preferences> = this.ow.getMainWindow()?.preferencesEventBus;
		// this.prefs$ = prefsSubject.asObservable();
		this.prefs = this.ow.getMainWindow()?.preferencesEventBus;
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	public listen$<S extends Selector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends Selector<infer T> ? T : never }> {
		return combineLatest(this.mainStore.asObservable(), this.prefs.asObservable()).pipe(
			// tap(([[main, nav], prefs]) => console.debug('emitting', [main, nav, prefs?.preferences], this)),
			map(([[main, nav], prefs]) => selectors.map((selector) => selector([main, nav, prefs?.preferences]))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends Selector<infer T> ? T : never }>;
	}

	public send(event: MainWindowStoreEvent) {
		this.stateUpdater.next(event);
	}
}

// TODO: move this somewhere else? To a facade?
export const currentBgHeroId = (main: MainWindowState, nav: NavigationState): string => {
	return nav.navigationBattlegrounds.selectedCategoryId?.includes('bgs-category-personal-hero-details-')
		? (main.battlegrounds.findCategory(
				nav.navigationBattlegrounds.selectedCategoryId,
		  ) as BattlegroundsPersonalStatsHeroDetailsCategory)?.heroId
		: null;
};

export const cdLog = (...args) => console.debug('[cd]', ...args);
