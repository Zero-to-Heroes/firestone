import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/reference-data';
import { IPreferences } from '@firestone/shared/framework/common';
import { CardsFacadeStandaloneService } from '@firestone/shared/framework/core';
import { TranslateService } from '@ngx-translate/core';
import { WebsiteLocalizationService } from './localization/website-localization.service';
import { WebsitePreferences } from './preferences/website-preferences';
import { WebsitePreferencesService } from './preferences/website-preferences.service';

@Injectable()
export class WebsiteBootstrapService {
	constructor(
		private readonly translate: TranslateService,
		private readonly prefs: WebsitePreferencesService,
		private readonly i18n: WebsiteLocalizationService,
		private readonly allCards: CardsFacadeStandaloneService,
	) {}

	public async init(): Promise<boolean> {
		const prefs: WebsitePreferences = await this.prefs.getPreferences();
		await Promise.all([this.initCards(prefs), this.initLocalizationService(prefs)]);
		return true;
	}

	private async initCards(prefs: IPreferences) {
		const service = new AllCardsService();
		await service.initializeCardsDb();
		await this.allCards.init(service, prefs.locale);
	}

	private async initLocalizationService(prefs: IPreferences) {
		// this language will be used as a fallback when a translation isn't found in the current language
		this.translate.setDefaultLang('enUS');
		// Load the locales first, otherwise some windows will be displayed with missing text
		await this.translate.use(prefs.locale).toPromise();
		await this.i18n.init(this.translate);
	}
}
