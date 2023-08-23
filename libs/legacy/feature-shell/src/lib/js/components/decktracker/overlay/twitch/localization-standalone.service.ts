import { Injectable } from '@angular/core';
import { CardsFacadeStandaloneService, ImageLocalizationOptions } from '@firestone/shared/framework/core';
import { CollectionCardType } from '@legacy-import/src/lib/js/models/collection/collection-card-type.type';
import { TranslateService } from '@ngx-translate/core';
import { formatClass } from '../../../../services/hs-utils';
import { capitalizeEachWord } from '../../../../services/utils';

// For Twitch
@Injectable()
export class LocalizationStandaloneService {
	private locale = 'enUS';
	private useHighResImages = true;

	constructor(
		private readonly allCards: CardsFacadeStandaloneService,
		private readonly translate: TranslateService,
	) {}

	public async setLocale(locale: string) {
		console.log('setting locale', locale, this.allCards, this.translate);
		this.locale = locale;
		await this.translate.use(locale).toPromise();
		await this.allCards.setLocale(locale);
	}

	public getCardImage(cardId: string, options?: ImageLocalizationOptions): string {
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
		return card?.name ?? defaultName;
	}

	public getCreatedByCardName(creatorCardId: string): string {
		return `Created by ${this.getCardName(creatorCardId) ?? 'unknown'}`;
	}

	public getUnknownCardName(playerClass: string = null): string {
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
