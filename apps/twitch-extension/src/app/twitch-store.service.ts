import { Injectable } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { PrefsSelector, Store, arraysEqual } from '@firestone/shared/framework/common';
import { BehaviorSubject, Observable, distinctUntilChanged, filter, from, map } from 'rxjs';

@Injectable()
export class TwitchStoreService extends Store<Preferences> {
	constructor(private readonly prefs: PreferencesService) {
		super();
	}

	async initComplete(): Promise<void> {
		return;
	}

	enablePremiumFeatures$(): Observable<boolean> {
		return new BehaviorSubject<boolean>(true).asObservable();
	}

	listenPrefs$<S extends PrefsSelector<Preferences, any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends PrefsSelector<Preferences, infer T> ? T : never }> {
		return this.prefs.preferences$$.pipe(
			filter((prefs) => !!prefs),
			map(
				(prefs) =>
					selectors.map((selector) => selector(prefs)) as {
						[K in keyof S]: S[K] extends PrefsSelector<Preferences, infer T> ? T : never;
					},
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends PrefsSelector<Preferences, infer T> ? T : never }>;
	}

	public shouldTrackLottery$(): Observable<boolean> {
		return from([false]);
	}
}
