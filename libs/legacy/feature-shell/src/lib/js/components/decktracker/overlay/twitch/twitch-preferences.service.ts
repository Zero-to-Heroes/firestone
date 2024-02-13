import { Injectable } from '@angular/core';
import { TwitchPreferences } from '@components/decktracker/overlay/twitch/twitch-preferences';
import { arraysEqual } from '@firestone/shared/framework/common';
import { BehaviorSubject, Observable, distinctUntilChanged, filter, map, shareReplay } from 'rxjs';

export type PrefsSelector<P extends TwitchPreferences, T> = (prefs: P) => T;

@Injectable()
export class TwitchPreferencesService {
	public prefs = new BehaviorSubject<TwitchPreferences>(new TwitchPreferences());

	public preferences$$ = new BehaviorSubject<TwitchPreferences>(null);

	constructor() {
		this.init();
	}

	public preferences$<S extends PrefsSelector<TwitchPreferences, any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends PrefsSelector<TwitchPreferences, infer T> ? T : never }> {
		return this.preferences$$.pipe(
			filter((prefs) => !!prefs),
			map((prefs) => selectors.map((selector) => selector(prefs))),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
		) as Observable<{ [K in keyof S]: S[K] extends PrefsSelector<TwitchPreferences, infer T> ? T : never }>;
	}

	public async init(): Promise<void> {
		let prefsStr: string = null;
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
