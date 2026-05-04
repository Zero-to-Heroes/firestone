import { Injectable } from '@angular/core';
import { PrefsSelector } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

import { DeckSummary } from '@firestone/constructed/common';
import { Preferences } from '@firestone/shared/common/service';
import { sleep } from '../utils';
import {
	AppUiStoreService,
	GameStateSelector,
	MercenariesHighlightsSelector,
	MercenariesOutOfCombatStateSelector,
	MercenariesStateSelector,
} from './app-ui-store.service';

// To be used in the UI, so that we only have a single service instantiated
@Injectable()
export class AppUiStoreFacadeService {
	private store: AppUiStoreService;

	constructor(private readonly ow: OverwolfService) {
		this.init();
	}

	private async init(attempts = 0) {
		this.store = this.ow.getMainWindow()?.appStore;
		while (!this.store) {
			if (attempts > 0 && attempts % 50 === 0) {
				console.warn('could not retrieve store from main window');
			}
			await sleep(200);
			this.store = this.ow.getMainWindow()?.appStore;
			attempts++;
		}
	}

	public async initComplete(): Promise<void> {
		await this.waitForStoreInstance();
		return this.store.initComplete();
	}

	/** @deprecated */
	public listenPrefs$<S extends PrefsSelector<Preferences, any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends PrefsSelector<Preferences, infer T> ? T : never }> {
		return this.store.listenPrefs$(...selectors);
	}

	public listenDeckState$<S extends GameStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends GameStateSelector<infer T> ? T : never }> {
		return this.store.listenDeckState$(...selectors);
	}

	public listenMercenaries$<S extends MercenariesStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesStateSelector<infer T> ? T : never }> {
		return this.store.listenMercenaries$(...selectors);
	}

	public listenMercenariesOutOfCombat$<S extends MercenariesOutOfCombatStateSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesOutOfCombatStateSelector<infer T> ? T : never }> {
		return this.store.listenMercenariesOutOfCombat$(...selectors);
	}

	public listenMercenariesHighlights$<S extends MercenariesHighlightsSelector<any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends MercenariesHighlightsSelector<infer T> ? T : never }> {
		return this.store.listenMercenariesHighlights$(...selectors);
	}

	/** @deprecated */
	public decks$(): Observable<readonly DeckSummary[]> {
		return this.store.decks$();
	}

	private async waitForStoreInstance(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.store) {
					resolve();
				} else {
					setTimeout(() => dbWait(), 20);
				}
			};
			dbWait();
		});
	}
}
