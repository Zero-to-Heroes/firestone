import { Injectable } from '@angular/core';
import { DuelsGroupedDecks } from '@models/duels/duels-grouped-decks';
import { DuelsHeroPlayerStat } from '@models/duels/duels-player-stats';
import { Observable } from 'rxjs';
import { BgsHeroStat } from '../../models/battlegrounds/stats/bgs-hero-stat';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../overwolf.service';
import {
	AppUiStoreService,
	BattlegroundsStateSelector,
	GameStateSelector,
	MercenariesHighlightsSelector,
	MercenariesOutOfCombatStateSelector,
	MercenariesStateSelector,
	NativeGameStateSelector,
	PrefsSelector,
	Selector,
} from './app-ui-store.service';

// To be used in the UI, so that we only have a single service instantiated
@Injectable()
export class AppUiStoreFacadeService {
	private store: AppUiStoreService;

	constructor(private readonly ow: OverwolfService) {
		this.init();
	}

	private async init() {
		this.store = this.ow.getMainWindow()?.appStore;
		if (!this.store) {
			console.warn('could not retrieve store from main window');
			setTimeout(() => this.init(), 100);
		}
	}

	public async initComplete(): Promise<void> {
		await this.waitForStoreInstance();
		return this.store.initComplete();
	}

	public listen$<S extends Selector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends Selector<infer T> ? T : never }> {
		return this.debugObservable(this.store.listen$(...selectors));
	}

	public listenPrefs$<S extends PrefsSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends PrefsSelector<infer T> ? T : never }> {
		return this.debugObservable(this.store.listenPrefs$(...selectors));
	}

	public listenDeckState$<S extends GameStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends GameStateSelector<infer T> ? T : never }> {
		return this.debugObservable(this.store.listenDeckState$(...selectors));
	}

	public listenNativeGameState$<S extends NativeGameStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends NativeGameStateSelector<infer T> ? T : never }> {
		return this.debugObservable(this.store.listenNativeGameState$(...selectors));
	}

	public listenBattlegrounds$<S extends BattlegroundsStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends BattlegroundsStateSelector<infer T> ? T : never }> {
		return this.debugObservable(this.store.listenBattlegrounds$(...selectors));
	}

	public listenMercenaries$<S extends MercenariesStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesStateSelector<infer T> ? T : never }> {
		return this.debugObservable(this.store.listenMercenaries$(...selectors));
	}

	public listenMercenariesOutOfCombat$<S extends MercenariesOutOfCombatStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesOutOfCombatStateSelector<infer T> ? T : never }> {
		return this.debugObservable(this.store.listenMercenariesOutOfCombat$(...selectors));
	}

	public listenMercenariesHighlights$<S extends MercenariesHighlightsSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesHighlightsSelector<infer T> ? T : never }> {
		return this.debugObservable(this.store.listenMercenariesHighlights$(...selectors));
	}

	public bgHeroStats$(): Observable<readonly BgsHeroStat[]> {
		return this.debugObservable(this.store.bgHeroStats$());
	}

	public duelsHeroStats$(): Observable<readonly DuelsHeroPlayerStat[]> {
		return this.debugObservable(this.store.duelsHeroStats$());
	}

	public duelsTopDecks$(): Observable<readonly DuelsGroupedDecks[]> {
		return this.debugObservable(this.store.duelsTopDecks$());
	}

	public gameStats$(): Observable<readonly GameStat[]> {
		return this.debugObservable(this.store.gameStats$());
	}

	public send(event: MainWindowStoreEvent) {
		return this.store.send(event);
	}

	private debugObservable<T>(obs: Observable<T>) {
		if (process.env.NODE_ENV === 'production') {
			return obs;
		}
		obs.subscribe = this.overrideSubscribe(obs, obs.subscribe, new Error(), this);
		return obs;
	}

	private overrideSubscribe(obs, oldSubscribe, error, obj) {
		return function () {
			const result = oldSubscribe.apply(obs, arguments);
			result['hop'] = error.stack.split('\n');
			result['hopContext'] = obj;
			result['hopArgs'] = arguments;
			return result;
		};
	}

	private async waitForStoreInstance(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.store) {
					resolve();
				} else {
					setTimeout(() => dbWait(), 10);
				}
			};
			dbWait();
		});
	}
}
