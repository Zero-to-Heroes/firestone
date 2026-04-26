import { Injectable } from '@angular/core';
import { PrefsSelector, Store } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay } from 'rxjs/operators';

import { ProfileBgHeroStat, ProfileClassProgress } from '@firestone-hs/api-user-profile';
import { DeckSummary } from '@firestone/constructed/common';
import { DecksProviderService } from '@firestone/decktracker/common';
import { BattlegroundsState, GameState, GameStateFacadeService } from '@firestone/game-state';
import { PatchesConfigService, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { MercenariesBattleState } from '../../models/mercenaries/mercenaries-battle-state';
import { MercenariesOutOfCombatState } from '../../models/mercenaries/out-of-combat/mercenaries-out-of-combat-state';
import {
	AchievementsLiveProgressTrackingService,
	AchievementsProgressTracking,
} from '../achievement/achievements-live-progress-tracking.service';
import { HighlightSelector } from '../mercenaries/highlights/mercenaries-synergies-highlight.service';
import { arraysEqual } from '../utils';

export type GameStateSelector<T> = (gameState: GameState) => T;
export type BattlegroundsStateSelector<T> = (state: [BattlegroundsState, Preferences?]) => T;
export type MercenariesStateSelector<T> = (state: [MercenariesBattleState, Preferences?]) => T;
export type MercenariesOutOfCombatStateSelector<T> = (state: [MercenariesOutOfCombatState, Preferences?]) => T;
export type MercenariesHighlightsSelector<T> = (state: [HighlightSelector, Preferences?]) => T;

@Injectable()
export class AppUiStoreService extends Store<Preferences> {
	private prefs: BehaviorSubject<Preferences>;
	private mercenariesStore: BehaviorSubject<MercenariesBattleState>;
	private mercenariesOutOfCombatStore: BehaviorSubject<MercenariesOutOfCombatState>;
	private mercenariesSynergiesStore: BehaviorSubject<HighlightSelector>;

	private decks: Observable<readonly DeckSummary[]>;
	private achievementsProgressTracking: Observable<readonly AchievementsProgressTracking[]>;
	private profileClassesProgress: Observable<readonly ProfileClassProgress[]>;
	private profileBgHeroStat: Observable<readonly ProfileBgHeroStat[]>;

	private initialized = false;

	constructor(
		private readonly ow: OverwolfService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly prefsService: PreferencesService,
		private readonly decksProvider: DecksProviderService,
		private readonly gameStateFacade: GameStateFacadeService,
	) {
		super();
		window['appStore'] = this;
	}

	// WARNING: All services used here should be called in BootstrapStoreServicesService to make sure they are booted up
	// This is called after all constructors have been called, so everything should be filled
	public async start() {
		await this.prefsService.isReady();
		await this.decksProvider.isReady();
		await waitForReady(this.gameStateFacade);

		this.prefs = this.prefsService.preferences$$;
		this.mercenariesStore = this.ow.getMainWindow().mercenariesStore;
		this.mercenariesOutOfCombatStore = this.ow.getMainWindow().mercenariesOutOfCombatStore;
		this.mercenariesSynergiesStore = this.ow.getMainWindow().mercenariesSynergiesStore;
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
		return this.gameStateFacade.gameState$$.pipe(
			filter((gameState) => !!gameState),
			map((gameState) => selectors.map((selector) => selector(gameState))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
		) as Observable<{ [K in keyof S]: S[K] extends GameStateSelector<infer T> ? T : never }>;
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

	public decks$(): Observable<readonly DeckSummary[]> {
		return this.decks;
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

	// TODO: this probably makes more sense in a facade. I'll move it when more methods like this
	// start appearing
	private async init() {
		await this.patchesConfig.isReady();

		// The rest
		this.initDecks();
		this.initAchievementsProgressTracking();
		this.initProfileClassProgress();
		this.initProfileBgHeroStat();
		this.initialized = true;
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

	private initDecks() {
		this.decks = this.decksProvider.decks$$;
	}
}

export const currentBgHeroId = (selectedCategoryId: string): string => {
	return selectedCategoryId?.includes('bgs-category-personal-hero-details-')
		? selectedCategoryId.split('bgs-category-personal-hero-details-')[1]
		: null;
};

export const cdLog = (...args) => {
	if (process.env.NODE_ENV !== 'production') {
		// console.debug('[cd]', ...args);
	}
};
