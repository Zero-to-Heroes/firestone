import { Injectable } from '@angular/core';
import { arraysEqual } from '@firestone/shared/framework/common';
import { BehaviorSubject, Observable, distinctUntilChanged, filter, map, shareReplay } from 'rxjs';
import { TwitchPreferences } from '../model/twitch-preferences';

export type PrefsSelector<P extends TwitchPreferences | null, T> = (prefs: P) => T;

@Injectable()
export class TwitchPreferencesService {
	public prefs = new BehaviorSubject<TwitchPreferences | null>(new TwitchPreferences());

	public preferences$$ = new BehaviorSubject<TwitchPreferences | null>(null);

	constructor() {
		this.init();
	}

	public async isReady(): Promise<boolean> {
		return true;
	}

	public preferences$<S extends PrefsSelector<TwitchPreferences | null, any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends PrefsSelector<TwitchPreferences | null, infer T> ? T : never }> {
		return this.preferences$$.pipe(
			filter((prefs) => !!prefs),
			map((prefs: any) => selectors.map((selector) => selector(prefs)) as any),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
		) as Observable<{ [K in keyof S]: S[K] extends PrefsSelector<TwitchPreferences | null, infer T> ? T : never }>;
	}

	public async init(): Promise<void> {
		let prefsStr: string | null = null;
		try {
			prefsStr = localStorage.getItem('firestone-twitch-preferences');
		} catch (e) {
			console.warn('could not load prefs', e);
		}
		const prefs = prefsStr ? Object.assign(new TwitchPreferences(), JSON.parse(prefsStr)) : new TwitchPreferences();
		this.prefs.next(prefs);
		this.preferences$$.next(prefs);
	}

	public async savePrefs(value: TwitchPreferences): Promise<void> {
		try {
			localStorage.setItem('firestone-twitch-preferences', JSON.stringify(value));
		} catch (e) {
			console.warn('could not save prefs', e);
		}
		this.prefs.next(value);
		this.preferences$$.next(value);
	}
}
