import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { WebsiteLocalizationService } from './localization/website-localization.service';
import { WebsitePreferencesService } from './preferences/website-preferences.service';

@Injectable()
export class WebsiteBootstrapService {
	constructor(
		private readonly translate: TranslateService,
		private readonly prefs: WebsitePreferencesService,
		private readonly i18n: WebsiteLocalizationService,
	) {}

	public async init(): Promise<boolean> {
		await Promise.all([this.initLocalizationService()]);
		return true;
	}

	private async initLocalizationService() {
		// this language will be used as a fallback when a translation isn't found in the current language
		this.translate.setDefaultLang('enUS');
		// Load the locales first, otherwise some windows will be displayed with missing text
		const prefs = await this.prefs.getPreferences();
		await this.translate.use(prefs.locale).toPromise();
		await this.i18n.init(this.translate);
	}
}
