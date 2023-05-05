import { Injectable } from '@angular/core';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { PrefsSelector } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { MailState } from '@mails/mail-state';
import { DuelsHeroPlayerStat } from '@models/duels/duels-player-stats';
import { Observable, Subscription } from 'rxjs';
import { TavernBrawlState } from '../../../libs/tavern-brawl/tavern-brawl-state';
import { DuelsDeckSummary } from '../../models/duels/duels-personal-deck';
import { DuelsRun } from '../../models/duels/duels-run';
import { DeckSummary } from '../../models/mainwindow/decktracker/deck-summary';
import { Preferences } from '../../models/preferences';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import {
	AppUiStoreService,
	BattlegroundsStateSelector,
	GameStateSelector,
	MercenariesHighlightsSelector,
	MercenariesOutOfCombatStateSelector,
	MercenariesStateSelector,
	ModsConfigSelector,
	NativeGameStateSelector,
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
			setTimeout(() => this.init(), 200);
		}
	}

	public async initComplete(): Promise<void> {
		await this.waitForStoreInstance();
		return this.store.initComplete();
	}

	public listen$<S extends Selector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends Selector<infer T> ? T : never }> {
		this.debugCall('listen$');
		return this.debugObservable(this.store.listen$(...selectors));
	}

	public listenPrefs$<S extends PrefsSelector<Preferences, any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends PrefsSelector<Preferences, infer T> ? T : never }> {
		this.debugCall('listenPrefs$');
		return this.debugObservable(this.store.listenPrefs$(...selectors));
	}

	public listenModsConfig$<S extends ModsConfigSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends ModsConfigSelector<infer T> ? T : never }> {
		this.debugCall('listenModsConfig$');
		return this.debugObservable(this.store.listenModsConfig$(...selectors));
	}

	public listenDeckState$<S extends GameStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends GameStateSelector<infer T> ? T : never }> {
		this.debugCall('listenDeckState$');
		return this.debugObservable(this.store.listenDeckState$(...selectors));
	}

	public listenNativeGameState$<S extends NativeGameStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends NativeGameStateSelector<infer T> ? T : never }> {
		this.debugCall('listenNativeGameState$');
		return this.debugObservable(this.store.listenNativeGameState$(...selectors));
	}

	public listenBattlegrounds$<S extends BattlegroundsStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends BattlegroundsStateSelector<infer T> ? T : never }> {
		this.debugCall('listenBattlegrounds$');
		return this.debugObservable(this.store.listenBattlegrounds$(...selectors));
	}

	public listenMercenaries$<S extends MercenariesStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesStateSelector<infer T> ? T : never }> {
		this.debugCall('listenMercenaries$');
		return this.debugObservable(this.store.listenMercenaries$(...selectors));
	}

	public listenMercenariesOutOfCombat$<S extends MercenariesOutOfCombatStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesOutOfCombatStateSelector<infer T> ? T : never }> {
		this.debugCall('listenMercenariesOutOfCombat$');
		return this.debugObservable(this.store.listenMercenariesOutOfCombat$(...selectors));
	}

	public listenMercenariesHighlights$<S extends MercenariesHighlightsSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesHighlightsSelector<infer T> ? T : never }> {
		this.debugCall('listenMercenariesHighlights$');
		return this.debugObservable(this.store.listenMercenariesHighlights$(...selectors));
	}

	public bgsMetaStatsHero$(): Observable<readonly BgsMetaHeroStatTierItem[]> {
		this.debugCall('bgsMetaStatsHero$');
		return this.debugObservable(this.store.bgsMetaStatsHero$());
	}

	public duelsHeroStats$(): Observable<readonly DuelsHeroPlayerStat[]> {
		this.debugCall('duelsHeroStats$');
		return this.debugObservable(this.store.duelsHeroStats$());
	}

	public gameStats$(): Observable<readonly GameStat[]> {
		this.debugCall('gameStats$');
		return this.debugObservable(this.store.gameStats$());
	}

	public duelsDecks$(): Observable<readonly DuelsDeckSummary[]> {
		this.debugCall('duelsDecks$');
		return this.debugObservable(this.store.duelsDecks$());
	}

	public duelsRuns$(): Observable<readonly DuelsRun[]> {
		this.debugCall('duelsRuns$');
		const result = this.debugObservable(this.store.duelsRuns$());
		return result;
	}

	public decks$(): Observable<readonly DeckSummary[]> {
		this.debugCall('decks$');
		return this.debugObservable(this.store.decks$());
	}

	public mails$(): Observable<MailState> {
		this.debugCall('mails$');
		return this.debugObservable(this.store.mails$());
	}

	public tavernBrawl$(): Observable<TavernBrawlState> {
		this.debugCall('tavernBrawl$');
		return this.debugObservable(this.store.tavernBrawl$());
	}

	public showAds$(): Observable<boolean> {
		this.debugCall('shouldShowAds$');
		return this.debugObservable(this.store.showAds$());
	}

	public isPremiumUser$(): Observable<boolean> {
		this.debugCall('isPremiumUser$');
		return this.debugObservable(this.store.isPremiumUser$());
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

	private overrideSubscribe<T>(obs: Observable<T>, oldSubscribe, error, obj) {
		return function () {
			// const sub = arguments[0];
			// sub['debugStack'] = error.stack.split('\n').filter((line) => line.includes('main.js'));
			// this.debugCall('hopArgs', arguments, sub);
			// obs['initStack'] = error.stack.split('\n');
			const result: Subscription = oldSubscribe.apply(obs, arguments);
			// result['stack'] = error.stack;
			// this.debugCall('override subscribe', result, obs, arguments, error);
			// result['hop'] = error.stack.split('\n');
			// result['hopContext'] = obj;
			// result['hopArgs'] = arguments;
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

	private debugCall(...args) {
		return;
		console.debug('[store-facade]', args, new Error());
	}
}
