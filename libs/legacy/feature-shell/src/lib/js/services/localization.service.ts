import { Injectable } from '@angular/core';
import { DiskCacheService, PreferencesService } from '@firestone/shared/common/service';
import { ImageLocalizationOptions } from '@firestone/shared/framework/core';
import { TranslateService } from '@ngx-translate/core';
import { Semaphore } from 'async-mutex';
import { from, Observable, of } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { CollectionCardType } from '../models/collection/collection-card-type.type';
import { formatClass } from './hs-utils';
import { sleep } from './utils';

@Injectable()
export class LocalizationService {
	private _locale = 'enUS';
	private useHighResImages: boolean;

	private useDiskCache = true;

	private translate: TranslateService;

	constructor(private readonly prefs: PreferencesService, private readonly diskCache: DiskCacheService) {}

	// FIXME: should handle all the init logic here (or create a facade?), instead of having it be in app-bootstrap
	public async initReady() {
		return new Promise<void>(async (resolve) => {
			while (!this.translate || !this.translate.store?.langs?.length) {
				await sleep(100);
			}

			resolve();
		});
	}

	public async start(translateService: TranslateService) {
		if (this.translate) {
			return;
		}

		this.translate = translateService;
		window['localizationService'] = this;

		console.log('[localization] Starting localization service pref updates init');
		this.prefs.preferences$$
			.pipe(
				map((prefs) => prefs?.locale),
				distinctUntilChanged(),
			)
			.subscribe((pref) => this.setLocale(pref));
		this.prefs.preferences$$
			.pipe(
				map((prefs) => prefs?.collectionUseHighResImages),
				distinctUntilChanged(),
			)
			.subscribe((pref) => {
				this.useHighResImages = pref;
			});
		// TODO: add pref for disk cache
		// TODO: automatically enable disk cache if slow connection (or alternatively if
		// from a locale with known issues)
	}

	public getTranslateService(): TranslateService {
		return this.translate;
	}

	public get locale() {
		return this._locale;
	}

	public async setLocale(locale: string) {
		await this.translate.use(locale).toPromise();
		this._locale = locale;
	}

	public getCreatedByCardName(cardName: string): string {
		return `Created by ${cardName ?? 'unknown'}`;
	}

	public getCardImage(cardId: string, options?: ImageLocalizationOptions): Observable<string> {
		if (!cardId) {
			return of(null);
		}
		const bgs = options?.isBgs ? 'bgs/' : '';
		const heroSkin = options?.isHeroSkin ? 'heroSkins/' : '';
		const highRes = this.useHighResImages || options?.isHighRes ? '512' : '256';
		const base = `cards/${bgs}${heroSkin}${this._locale}/${highRes}`;
		const typeSuffix = this.buildTypeSuffix(options?.cardType);
		const suffix = `${cardId}${typeSuffix}.png`;
		const cardPath = `${base}/${suffix}`;
		const url = `https://static.firestoneapp.com/${cardPath}`;
		if (!this.useDiskCache) {
			return of(url);
		}

		return from(this.diskCache.getBinaryFile(cardPath)).pipe(
			switchMap((cached: Blob | null) => {
				if (cached /*&& !this.isCacheExpired(cardPath)*/) {
					console.debug('[localization] using cached image', cardPath, cached);
					return of(URL.createObjectURL(cached));
				}
				return from(fetch(url)).pipe(
					switchMap(async (response) => {
						if (response.ok) {
							const clone = response.clone();
							const blob = await clone.blob();
							// console.debug('[localization] saving image to disk cache', cardPath, response, blob);
							this.saveBinaryFile(url, cardPath);
							return url;
						}
						console.error('[localization] could not fetch image', cardPath, response);
						return null;
					}),
					// catchError(() => of(null))
				);
			}),
			// catchError(() => of(url))
		);
	}

	public getNonLocalizedCardImage(cardId: string, options?: ImageLocalizationOptions): Observable<string> {
		if (!cardId) {
			return null;
		}
		const base = `https://static.firestoneapp.com/cards`;
		const typeSuffix = this.buildTypeSuffix(options?.cardType);
		const suffix = `${cardId}${typeSuffix}.png`;
		return from([`${base}/${suffix}`]);
	}

	public getUnknownCardName(i18n: { translateString: (string) => string }, playerClass: string = null): string {
		return playerClass
			? this.translateString('decktracker.unknown-class-card', {
					playerClass: formatClass(playerClass, i18n),
			  })
			: this.translateString('decktracker.unknown-card');
	}

	public getUnknownManaSpellName(manaCost: number): string {
		return this.translateString('decktracker.unknown-mana-spell', {
			manaCost: manaCost,
		});
	}

	public getUnknownManaMinionName(manaCost: number): string {
		return this.translateString('decktracker.unknown-mana-minion', {
			manaCost: manaCost,
		});
	}

	public getUnknownRaceName(info: string): string {
		return this.translateString('decktracker.unknown-info', {
			info: info,
		});
	}

	public translateString(key: string, params: any = null): string {
		return this.translate.instant(key, params);
	}

	// TODO translate
	public formatCurrentLocale(): string {
		switch (this._locale) {
			case 'deDE':
				return 'de-DE';
			case 'enUS':
				return 'en-US';
			case 'esES':
				return 'es-ES';
			case 'esMX':
				return 'es-MX';
			case 'frFR':
				return 'fr-FR';
			case 'itIT':
				return 'it-IT';
			case 'jaJP':
				return 'ja-JP';
			case 'koKR':
				return 'ko-KR';
			case 'plPL':
				return 'pl-PL';
			case 'ptBR':
				return 'pt-BR';
			case 'ruRU':
				return 'ru-RU';
			case 'thTH':
				return 'th-TH';
			case 'zhCN':
				return 'zh-CN';
			case 'zhTW':
				return 'zh-TW';
			default:
				return 'en-US';
		}
	}

	public getFirestoneLocale(locale: string): string {
		switch (locale) {
			case 'en-US':
			case 'en':
				return 'enUS';
			case 'de-DE':
			case 'de':
				return 'deDE';
			case 'es-ES':
			case 'es':
				return 'esES';
			case 'es-MX':
				return 'esMX';
			case 'fr-FR':
			case 'fr':
				return 'frFR';
			case 'it-IT':
			case 'it':
				return 'itIT';
			case 'ja-JP':
			case 'ja':
				return 'jaJP';
			case 'ko-KR':
			case 'ko':
				return 'koKR';
			case 'pl-PL':
			case 'pl':
				return 'plPL';
			case 'pt-BR':
			case 'pt':
				return 'ptBR';
			case 'ru-RU':
			case 'ru':
				return 'ruRU';
			case 'th-TH':
			case 'th':
				return 'thTH';
			case 'zh-CN':
				return 'zhCN';
			case 'zh-TW':
			case 'zh':
				return 'zhTW';
			default:
				return 'enUS';
		}
	}

	private buildTypeSuffix(cardType: CollectionCardType): string {
		switch (cardType) {
			case 'NORMAL':
				return '';
			case 'GOLDEN':
				return '_golden';
			case 'DIAMOND':
				return '_diamond';
			case 'SIGNATURE':
				return '_signature';
			default:
				return '';
		}
	}

	private saveFileSemaphore = new Semaphore(1); // Limit to 3 concurrent calls
	private async saveBinaryFile(url: string, cardPath: string) {
		console.debug('[localization] preparing to acquire lock to save image', cardPath);
		await this.saveFileSemaphore.acquire();
		try {
			console.debug('[localization] acquired lock to save image', cardPath);
			await this.diskCache.saveBinaryFile(url, cardPath);
			console.debug('[localization] saved image to disk cache', cardPath);
		} finally {
			this.saveFileSemaphore.release();
			console.debug('[localization] released lock to save image', cardPath);
		}
	}
}
