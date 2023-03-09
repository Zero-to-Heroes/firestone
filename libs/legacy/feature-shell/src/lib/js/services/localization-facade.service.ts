import { Injectable } from '@angular/core';
import { ILocalizationService, ImageLocalizationOptions, OverwolfService } from '@firestone/shared/framework/core';
import { TranslateService } from '@ngx-translate/core';
import { LocalizationService } from './localization.service';

@Injectable()
export class LocalizationFacadeService implements ILocalizationService {
	private service: LocalizationService;

	constructor(private readonly ow: OverwolfService) {
		this.init();
	}

	public getTranslateService(): TranslateService {
		return this.service.getTranslateService();
	}

	public async setLocale(locale: string) {
		this.service.setLocale(locale);
	}

	public get locale() {
		return this.service.locale;
	}

	public init() {
		this.service = this.ow.getMainWindow().localizationService;
		if (!this.service) {
			console.warn('localization init failed, retrying');
			setTimeout(() => this.init(), 20);
			return;
		}
	}

	public getCardImage(cardId: string, options?: ImageLocalizationOptions): string {
		return this.service.getCardImage(cardId, options);
	}

	public getNonLocalizedCardImage(cardId: string, options?: ImageLocalizationOptions): string {
		return this.service.getNonLocalizedCardImage(cardId, options);
	}

	public getCardName(cardId: string, defaultName: string = null): string {
		return this.service.getCardName(cardId, defaultName);
	}

	public getCreatedByCardName(creatorCardId: string): string {
		return this.service.getCreatedByCardName(creatorCardId);
	}

	public getUnknownCardName(playerClass: string = null): string {
		return this.service.getUnknownCardName(this, playerClass);
	}

	public getUnknownManaSpellName(manaCost: number): string {
		return this.service.getUnknownManaSpellName(manaCost);
	}

	public getUnknownRaceName(race: string): string {
		return this.service.getUnknownRaceName(race);
	}

	public translateString(key: string, params: any = null): string {
		return this.service.translateString(key, params);
	}

	public formatCurrentLocale(): string {
		return this.service.formatCurrentLocale();
	}
}
