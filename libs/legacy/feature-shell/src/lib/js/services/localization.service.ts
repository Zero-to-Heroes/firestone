import { Injectable } from '@angular/core';
import { CardsFacadeService, ImageLocalizationOptions, OverwolfService } from '@firestone/shared/framework/core';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { CollectionCardType } from '../models/collection/collection-card-type.type';
import { formatClass } from './hs-utils';
import { AppUiStoreFacadeService } from './ui-store/app-ui-store-facade.service';
import { sleep } from './utils';

@Injectable()
export class LocalizationService {
	private _locale = 'enUS';
	private useHighResImages: boolean;

	private translate: TranslateService;

	private ready = false;

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly ow: OverwolfService,
	) {}

	// FIXME: should handle all the init logic here (or create a facade?), instead of having it be in app-bootstrap
	public async initReady() {
		return new Promise<void>(async (resolve) => {
			while (!this.ready || !this.translate || !this.translate.store?.langs?.length) {
				await sleep(100);
			}

			resolve();
		});
	}

	public setReady(value: boolean) {
		this.ready = value;
	}

	public async start() {
		await this.store.initComplete();
		this.translate = this.ow.getMainWindow().translateService;
		this.store
			.listen$(([main, nav, prefs]) => prefs?.locale)
			.pipe(map(([pref]) => pref))
			.subscribe((pref) => this.setLocale(pref));
		this.store
			.listen$(([main, nav, prefs]) => prefs.collectionUseHighResImages)
			.pipe(map(([pref]) => pref))
			.subscribe((pref) => {
				this.useHighResImages = pref;
			});
		window['localizationService'] = this;
	}

	public getTranslateService(): TranslateService {
		return this.translate;
	}

	public get locale() {
		return this._locale;
	}

	public setLocale(locale: string) {
		this._locale = locale;
	}

	public getCardImage(cardId: string, options?: ImageLocalizationOptions): string {
		if (!cardId) {
			return null;
		}
		const bgs = options?.isBgs ? 'bgs/' : '';
		const heroSkin = options?.isHeroSkin ? 'heroSkins/' : '';
		const highRes = this.useHighResImages || options?.isHighRes ? '512' : '256';
		const base = `https://static.firestoneapp.com/cards/${bgs}${heroSkin}${this._locale}/${highRes}`;
		const typeSuffix = this.buildTypeSuffix(options?.cardType);
		const suffix = `${cardId}${typeSuffix}.png`;
		return `${base}/${suffix}`;
	}

	public getNonLocalizedCardImage(cardId: string, options?: ImageLocalizationOptions): string {
		if (!cardId) {
			return null;
		}
		const base = `https://static.firestoneapp.com/cards`;
		const typeSuffix = this.buildTypeSuffix(options?.cardType);
		const suffix = `${cardId}${typeSuffix}.png`;
		return `${base}/${suffix}`;
	}

	// Because each localization has its own file, we always get the info from the root
	public getCardName(cardId: string, defaultName: string = null): string {
		const card = this.allCards.getCard(cardId);
		// const loc = card.locales?.find((locale) => locale?.locale === this.locale);
		return card?.name ?? defaultName;
	}

	public getCreatedByCardName(creatorCardId: string): string {
		return this.translateString('decktracker.created-by', {
			value: this.getCardName(creatorCardId) ?? this.getUnknownCardName(null),
		});
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
}
