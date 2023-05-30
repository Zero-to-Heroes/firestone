import { Injectable } from '@angular/core';
import { arraysEqual, PrefsSelector, Store } from '@firestone/shared/framework/common';
import { distinctUntilChanged, filter, map, Observable } from 'rxjs';
import { WebsitePreferences } from '../preferences/website-preferences';
import { WebsitePreferencesService } from '../preferences/website-preferences.service';

@Injectable()
export class WebsiteStoreService extends Store<WebsitePreferences> {
	constructor(private readonly prefs: WebsitePreferencesService) {
		super();
	}

	public async initComplete(): Promise<void> {
		return;
	}

	listenPrefs$<S extends PrefsSelector<WebsitePreferences, any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends PrefsSelector<WebsitePreferences, infer T> ? T : never }> {
		return this.prefs.preferences$$.pipe(
			filter((prefs) => !!prefs),
			map(
				(prefs) =>
					selectors.map((selector) => selector(prefs)) as {
						[K in keyof S]: S[K] extends PrefsSelector<WebsitePreferences, infer T> ? T : never;
					},
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
		) as Observable<{ [K in keyof S]: S[K] extends PrefsSelector<WebsitePreferences, infer T> ? T : never }>;
	}
}
