import { Injectable } from '@angular/core';
import { PrefsSelector, Store } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';

import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay } from 'rxjs/operators';

import { DeckSummary } from '@firestone/constructed/common';
import { DecksProviderService } from '@firestone/decktracker/common';
import { BattlegroundsState, GameState, GameStateFacadeService } from '@firestone/game-state';
import { ProfileServiceFacade } from '@firestone/profile/common';
import { PatchesConfigService, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual } from '../utils';

export type GameStateSelector<T> = (gameState: GameState) => T;
export type BattlegroundsStateSelector<T> = (state: [BattlegroundsState, Preferences?]) => T;

@Injectable()
export class AppUiStoreService extends Store<Preferences> {
	private prefs: BehaviorSubject<Preferences>;

	private decks: Observable<readonly DeckSummary[]>;

	private initialized = false;

	constructor(
		private readonly ow: OverwolfService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly prefsService: PreferencesService,
		private readonly decksProvider: DecksProviderService,
		private readonly gameStateFacade: GameStateFacadeService,
		private readonly profileFacade: ProfileServiceFacade,
	) {
		super();
		window['appStore'] = this;
	}

	// WARNING: All services used here should be called in BootstrapStoreServicesService to make sure they are booted up
	// This is called after all constructors have been called, so everything should be filled
	public async start() {
		await this.prefsService.isReady();
		await this.decksProvider.isReady();
		await waitForReady(this.gameStateFacade, this.profileFacade);

		this.prefs = this.prefsService.preferences$$;
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

	public decks$(): Observable<readonly DeckSummary[]> {
		return this.decks;
	}

	// TODO: this probably makes more sense in a facade. I'll move it when more methods like this
	// start appearing
	private async init() {
		await this.patchesConfig.isReady();

		// The rest
		this.initDecks();
		this.initialized = true;
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
