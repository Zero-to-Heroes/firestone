import { Observable } from 'rxjs';
import { IPreferences } from '../models/preferences';

export type PrefsSelector<P extends IPreferences, T> = (prefs: P) => T;

export abstract class Store<P extends IPreferences> {
	abstract initComplete(): Promise<void>;

	abstract listenPrefs$<S extends PrefsSelector<P, any>[]>(
		...selectors: S
	): Observable<{ [K in keyof S]: S[K] extends PrefsSelector<P, infer T> ? T : never }>;
}
