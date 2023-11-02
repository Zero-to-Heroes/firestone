import { Injectable } from '@angular/core';
import { sleep } from '@firestone/shared/framework/common';
import { ILocalizationService, ImageLocalizationOptions, WindowManagerService } from '@firestone/shared/framework/core';
import { TranslateService } from '@ngx-translate/core';
import { LocalizationService } from './localization.service';

@Injectable()
export class LocalizationFacadeService implements ILocalizationService {
	private service: LocalizationService;

	constructor(private readonly windowManager: WindowManagerService) {
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

	public async init(attempts = 0) {
		if (this.service) {
			return;
		}

		const mainWindow = await this.windowManager.getMainWindow();
		this.service = mainWindow.localizationService;
		while (!this.service) {
			if (attempts > 0 && attempts % 50 === 0) {
				console.warn('localization init failed, retrying');
			}
			await sleep(200);
			this.service = mainWindow.localizationService;
			attempts++;
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
