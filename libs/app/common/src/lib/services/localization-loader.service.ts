import { Injectable } from '@angular/core';
import { DiskCacheService } from '@firestone/shared/common/service';
import { translationFileVersion } from '@firestone/shared/framework/common';
import { ApiRunner, AppInjector } from '@firestone/shared/framework/core';
import { TranslateLoader, TranslateService } from '@ngx-translate/core';
import { from, map, Observable, of, switchMap, tap } from 'rxjs';

const TRANSLATION_PRIMARY_BASE_URL = 'https://static.firestoneapp.com/data/i18n';
/** Fallback base URL when primary is unreachable (e.g. firewall). Set to empty string to disable. */
const TRANSLATION_FALLBACK_BASE_URL = 'https://static.zerotoheroes.com/hearthstone/data/i18n';

@Injectable({ providedIn: 'root' })
export class LocalizationLoaderWithCache implements TranslateLoader {
	private lastTranslationTimestamp = 0;

	constructor(
		private readonly cache: DiskCacheService,
		private readonly api: ApiRunner,
	) {}

	public getTranslation(lang: string): Observable<any> {
		const primaryUrl = `${TRANSLATION_PRIMARY_BASE_URL}/${lang}.json?v=${translationFileVersion}`;
		const fallbackUrl = TRANSLATION_FALLBACK_BASE_URL
			? `${TRANSLATION_FALLBACK_BASE_URL}/${lang}.json?v=${translationFileVersion}`
			: null;
		console.debug('[bootstrap] [localization-loader] fetching translation', lang, primaryUrl);

		// This won't update the translations with the latest value right away, meaning we'll always
		// use the cached value, then update the cache, and get that cached value on next startup
		// I think it's acceptable to have a slight delay in the translation update
		// That's because TranslateService has a take(1) for the Observable
		return from(this.cache.getItem<object | null>(`localization-${lang}.json`)).pipe(
			switchMap((cachedData) => {
				if (cachedData) {
					console.debug('[bootstrap] [localization-loader] got cached translation', lang, cachedData);
					this.fetchAndCacheTranslation(primaryUrl, fallbackUrl, lang, true).subscribe();
					// Emit cached data first
					return of(cachedData);
				} else {
					// If no cached data, directly fetch from remote
					return this.fetchAndCacheTranslation(primaryUrl, fallbackUrl, lang);
				}
			}),
		);
	}

	private fetchAndCacheTranslation(
		primaryUrl: string,
		fallbackUrl: string | null,
		lang: string,
		emit = false,
	): Observable<any> {
		return from(this.api.get(primaryUrl)).pipe(
			switchMap((response) => {
				const parsed = this.tryParseTranslation(response);
				if (parsed != null) {
					return of({ data: parsed, url: primaryUrl });
				}
				if (fallbackUrl) {
					console.debug('[bootstrap] [localization-loader] primary failed, trying fallback', fallbackUrl);
					return from(this.api.get(fallbackUrl)).pipe(
						map((fallbackResponse) => ({
							data: this.tryParseTranslation(fallbackResponse),
							url: fallbackUrl,
						})),
					);
				}
				return of({ data: null, url: primaryUrl });
			}),
			map(({ data }) => data),
			tap(async (response) => {
				if (response == null) {
					return;
				}
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

	private tryParseTranslation(response: string | undefined): object | null {
		if (response == null || response === '') {
			return null;
		}
		try {
			return JSON.parse(response) as object;
		} catch {
			return null;
		}
	}
}
