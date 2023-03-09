import { TranslateService } from '@ngx-translate/core';

// Because interfaces cannot be used as DI tokens
export abstract class ILocalizationService {
	abstract getTranslateService(): TranslateService;
	abstract setLocale(locale: string): void;
	abstract get locale(): string;
	abstract getCardImage(cardId: string, options?: ImageLocalizationOptions): string | null;
	abstract getNonLocalizedCardImage(cardId: string, options?: ImageLocalizationOptions): string | null;
	abstract getCardName(cardId: string, defaultName: string): string | null;
	abstract getCreatedByCardName(creatorCardId: string): string | null;
	abstract getUnknownCardName(playerClass: string | null): string | null;
	abstract getUnknownManaSpellName(manaCost: number): string | null;
	abstract getUnknownRaceName(race: string): string | null;
	abstract translateString(key: string, params?: any): string | null;
	abstract formatCurrentLocale(): string | null;
}

export interface ImageLocalizationOptions {
	readonly isBgs?: boolean;
	readonly isPremium?: boolean;
	readonly isHighRes?: boolean;
	readonly isHeroSkin?: boolean;
}

export const formatClass = (playerClass: string, i18n: { translateString: (string) => string }): string => {
	return i18n.translateString(`global.class.${playerClass?.toLowerCase()}`);
};
