import { Injectable } from '@angular/core';
import { formatClass } from '../../../../services/hs-utils';
import { ImageLocalizationOptions } from '../../../../services/localization.service';
import { capitalizeEachWord, uuid } from '../../../../services/utils';
import { CardsFacadeStandaloneService } from './cards-facade-standalone.service';

// For Twitch
@Injectable()
export class LocalizationStandaloneService {
	private locale = 'enUS';
	private useHighResImages = true;

	constructor(private readonly allCards: CardsFacadeStandaloneService) {}

	public async setLocale(locale: string) {
		this.locale = locale;
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
		const suffix = `${cardId}${options?.isPremium ? '_golden' : ''}.png`;
		return `${base}/${suffix}?v=2`;
	}

	public getNonLocalizedCardImage(cardId: string, options?: ImageLocalizationOptions): string {
		if (!cardId) {
			return null;
		}
		const base = `https://static.firestoneapp.com/cards`;
		const suffix = `${cardId}${options?.isPremium ? '_golden' : ''}.png`;
		return `${base}/${suffix}?v=2`;
	}

	// Because each localization has its own file, we always get the info from the root
	public getCardName(cardId: string, defaultName: string = null): string {
		const card = this.allCards.getCard(cardId);
		// const loc = card.locales?.find((locale) => locale?.locale === this.locale);
		return card?.name ?? defaultName;
	}

	public getCreatedByCardName(creatorCardId: string): string {
		return `Created by ${this.getCardName(creatorCardId) ?? 'unknown'}`;
	}

	public getUnknownCardName(playerClass: string = null): string {
		return playerClass ? `Unknown ${formatClass(playerClass)} card` : 'Unknown Card';
	}

	public getUnknownManaSpellName(manaCost: number): string {
		return `Unknown ${manaCost} mana spell`;
	}

	public getUnknownRaceName(race: string): string {
		return `Unknown ${capitalizeEachWord(race)}`;
	}
}
