import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DiskCacheService } from '@firestone/shared/common/service';
import { translationFileVersion } from '@firestone/shared/framework/common';
import { AppInjector } from '@firestone/shared/framework/core';
import { TranslateLoader, TranslateService } from '@ngx-translate/core';
import { from, Observable, of, switchMap, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LocalizationLoaderWithCache implements TranslateLoader {
	private lastTranslationTimestamp = 0;

	constructor(private readonly cache: DiskCacheService, private readonly http: HttpClient) {}

	public getTranslation(lang: string): Observable<any> {
		const url = `https://static.firestoneapp.com/data/i18n/${lang}.json?v=${translationFileVersion}`;
		console.debug('[bootstrap] [localization-loader] fetching translation', lang, url);

		// This won't update the translations with the latest value right away, meaning we'll always
		// use the cached value, then update the cache, and get that cached value on next startup
		// I think it's acceptable to have a slight delay in the translation update
		// That's because TranslateService has a take(1) for the Observable
		return from(this.cache.getItem<object | null>(`localization-${lang}.json`)).pipe(
			switchMap((cachedData) => {
				if (cachedData) {
					console.debug('[bootstrap] [localization-loader] got cached translation', lang, cachedData);
					this.fetchAndCacheTranslation(url, lang, true).subscribe();
					// Emit cached data first
					return of(cachedData);
				} else {
					// If no cached data, directly fetch from remote
					return this.fetchAndCacheTranslation(url, lang);
				}
			}),
		);
	}

	private fetchAndCacheTranslation(url: string, lang: string, emit = false): Observable<any> {
		return this.http.get(url).pipe(
			tap(async (response) => {
				console.debug('[bootstrap] [localization-loader] got remote translation', lang, response);
				await this.cache.storeItem(`localization-${lang}.json`, response);
				if (emit && (Date.now() - this.lastTranslationTimestamp) / 1000 > 60) {
					// Reload the translations
					const service = AppInjector.get(TranslateService);
					console.debug(
						'[bootstrap] [localization-loader] reloading translations',
						lang,
						service.currentLang,
					);
					service.reloadLang(lang);
				}
				this.lastTranslationTimestamp = Date.now();
			}),
		);
	}
}
