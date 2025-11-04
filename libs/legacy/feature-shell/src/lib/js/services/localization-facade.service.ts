import { Injectable } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { sleep } from '@firestone/shared/framework/common';
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
		await this.service.setLocale(locale);
	}

	public get locale() {
		return this.service.locale;
	}

	public async init(attempts = 0) {
		if (this.service) {
			return;
		}

		this.service = this.ow.getMainWindow().localizationService;
		while (!this.service) {
			if (attempts > 0 && attempts % 50 === 0) {
				console.warn('localization init failed, retrying');
			}
			await sleep(200);
			this.service = this.ow.getMainWindow().localizationService;
			attempts++;
		}
	}

	public getCardImage(cardId: string, options?: ImageLocalizationOptions): string {
		return this.service.getCardImage(cardId, options);
	}

	public getNonLocalizedCardImage(cardId: string, options?: ImageLocalizationOptions): string {
		return this.service.getNonLocalizedCardImage(cardId, options);
	}

	public getCreatedByCardName(cardName: string): string {
		return this.service.getCreatedByCardName(cardName);
	}

	public getLastAffectedByCardName(cardName: string): string {
		return this.service.getLastAffectedByCardName(cardName);
	}

	public getUnknownCardName(playerClass: string = null): string {
		return this.service.getUnknownCardName(this, playerClass);
	}

	public getUnknownMechanicsName(gameTag: GameTag): string {
		return this.service.getUnknownMechanicsName(gameTag);
	}

	public getUnknownManaSpellName(manaCost: number): string {
		return this.service.getUnknownManaSpellName(manaCost);
	}

	public getUnknownManaMinionName(manaCost: number): string {
		return this.service.getUnknownManaMinionName(manaCost);
	}

	public getUnknownMinionName(): string {
		return this.service.getUnknownMinionName();
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
