/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/reference-data';
import { formatClass, ILocalizationService, ImageLocalizationOptions } from '@firestone/shared/framework/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class WebsiteLocalizationService extends ILocalizationService {
	private _locale = 'enUS';
	private useHighResImages = true;

	private translate: TranslateService;

	constructor(private readonly allCards: AllCardsService) {
		super();
	}

	public async init(translate: TranslateService) {
		this.translate = translate;
	}

	public getTranslateService(): TranslateService {
		return this.translate;
	}

	public setLocale(locale: string): void {
		this._locale = locale;
	}

	public get locale(): string {
		return this._locale;
	}

	public getCardImage(cardId: string, options?: ImageLocalizationOptions | undefined): string | null {
		if (!cardId) {
			return null;
		}
		const bgs = options?.isBgs ? 'bgs/' : '';
		const heroSkin = options?.isHeroSkin ? 'heroSkins/' : '';
		const highRes = this.useHighResImages || options?.isHighRes ? '512' : '256';
		const base = `https://static.firestoneapp.com/cards/${bgs}${heroSkin}${this._locale}/${highRes}`;
		const suffix = `${cardId}${options?.isPremium ? '_golden' : ''}.png`;
		return `${base}/${suffix}`;
	}

	public getNonLocalizedCardImage(cardId: string, options?: ImageLocalizationOptions): string | null {
		if (!cardId) {
			return null;
		}
		const base = `https://static.firestoneapp.com/cards`;
		const suffix = `${cardId}${options?.isPremium ? '_golden' : ''}.png`;
		return `${base}/${suffix}`;
	}

	// Because each localization has its own file, we always get the info from the root
	public getCardName(cardId: string, defaultName: string | null = null): string {
		const card = this.allCards.getCard(cardId);
		// const loc = card.locales?.find((locale) => locale?.locale === this.locale);
		return card?.name ?? defaultName;
	}

	public getCreatedByCardName(creatorCardId: string): string {
		return this.translateString('decktracker.created-by', {
			value: this.getCardName(creatorCardId) ?? this.getUnknownCardName(null),
		});
	}

	public getUnknownCardName(playerClass: string | null = null): string {
		return playerClass
			? this.translateString('decktracker.unknown-class-card', {
					playerClass: formatClass(playerClass, this),
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
}
