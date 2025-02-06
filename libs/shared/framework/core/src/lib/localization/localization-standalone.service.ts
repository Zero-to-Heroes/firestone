import { Injectable } from '@angular/core';
import { CollectionCardType } from '@firestone-hs/user-packs';
import { capitalizeEachWord } from '@firestone/shared/framework/common';
import { TranslateService } from '@ngx-translate/core';
import { CardsFacadeStandaloneService } from '../services/cards-facade-standalone.service';
import { ILocalizationService, ImageLocalizationOptions, formatClass } from './localization.service';

@Injectable()
export class LocalizationStandaloneService implements ILocalizationService {
	public locale = 'enUS';
	private useHighResImages = true;

	constructor(
		private readonly allCards: CardsFacadeStandaloneService,
		private readonly translate: TranslateService,
	) {}

	public getTranslateService(): TranslateService {
		return this.translate;
	}

	public async setLocale(locale: string) {
		console.log('setting locale', locale);
		this.locale = locale;
		await this.translate.use(locale).toPromise();
		await this.allCards.setLocale(locale);
	}

	public formatCurrentLocale(): string {
		switch (this.locale) {
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

	public getCardImage(cardId: string, options?: ImageLocalizationOptions): string | null {
		if (!cardId) {
			return null;
		}
		const bgs = options?.isBgs ? 'bgs/' : '';
		const heroSkin = options?.isHeroSkin ? 'heroSkins/' : '';
		const highRes = this.useHighResImages || options?.isHighRes ? '512' : '256';
		const base = `https://static.firestoneapp.com/cards/${bgs}${heroSkin}${this.locale}/${highRes}`;
		const typeSuffix = this.buildTypeSuffix(options?.cardType);
		const suffix = `${cardId}${typeSuffix}.png`;
		return `${base}/${suffix}`;
	}

	public getNonLocalizedCardImage(cardId: string, options?: ImageLocalizationOptions): string | null {
		if (!cardId) {
			return null;
		}
		const base = `https://static.firestoneapp.com/cards`;
		const typeSuffix = this.buildTypeSuffix(options?.cardType);
		const suffix = `${cardId}${typeSuffix}.png`;
		return `${base}/${suffix}`;
	}

	public getCreatedByCardName(cardName: string): string {
		return `Created by ${cardName ?? 'unknown'}`;
	}

	public getUnknownCardName(playerClass: string | null = null): string {
		return playerClass ? `Unknown ${formatClass(playerClass, this)} card` : 'Unknown Card';
	}

	public getUnknownManaSpellName(manaCost: number): string {
		return `Unknown ${manaCost} mana spell`;
	}

	public getUnknownRaceName(race: string): string {
		return `Unknown ${capitalizeEachWord(race)}`;
	}

	public translateString(key: string, params: any = null): string {
		return this.translate.instant(key, params);
	}

	private buildTypeSuffix(cardType: CollectionCardType | null | undefined): string {
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
