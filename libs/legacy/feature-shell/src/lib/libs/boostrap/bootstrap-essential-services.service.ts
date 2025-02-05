import { Injectable } from '@angular/core';
import { SettingsControllerService } from '@firestone/settings';
import { DiskCacheService, OwNotificationsService, PreferencesService } from '@firestone/shared/common/service';
import { IndexedDbService, OverwolfService, OwUtilsService } from '@firestone/shared/framework/core';
import { TranslateService } from '@ngx-translate/core';
import { CardsInitService } from '../../js/services/cards-init.service';
import { DebugService } from '../../js/services/debug.service';
import { LocalizationFacadeService } from '../../js/services/localization-facade.service';
import { LocalizationService } from '../../js/services/localization.service';

@Injectable()
export class BootstrapEssentialServicesService {
	// All the constructors are there to start bootstrapping / registering everything
	constructor(
		private readonly debugService: DebugService,
		private readonly prefs: PreferencesService,
		private readonly diskCache: DiskCacheService,
		private readonly db: IndexedDbService,
		private readonly initCardsService: CardsInitService,
		private readonly translate: TranslateService,
		private readonly localizationService: LocalizationService,
		private readonly localizationFacadeService: LocalizationFacadeService,
		private readonly notifs: OwNotificationsService,
		private readonly init_OWUtilsService: OwUtilsService,
		// private readonly translateCacheService: TranslateCacheService,
		private readonly init_SettingsControllerService: SettingsControllerService,
		private readonly ow: OverwolfService,
	) {}

	public async bootstrapServices(): Promise<void> {
		await this.db.init();
		// First initialize the cards DB, as some of the dependencies injected in
		// app-bootstrap won't be able to start without the cards DB in place
		window['translateService'] = this.translate;
		await this.initLocalization();
		// Init is started in the constructor, but we make sure that all cards are properly retrieved before moving forward
		await this.initCardsService.init();
		// this.init_OWUtilsService.initialize();
	}

	private async initLocalization() {
		// console.debug('[bootstrap] setting default language');
		// this language will be used as a fallback when a translation isn't found in the current language
		// this.translate.setDefaultLang('enUS');
		// Load the locales first, otherwise some windows will be displayed with missing text
		let prefs = await this.prefs.getPreferences();
		console.debug('[bootstrap] [localization] setting language', prefs.locale);
		let locale = prefs.locale;
		if (!prefs.hasChangedLocale) {
			const systemInfo = await this.ow.getSystemInformation();
			console.debug('[bootstrap] [localization] system info', systemInfo);
			const systemLocale = systemInfo?.SystemLanguage;
			if (!!systemLocale?.length) {
				locale = this.localizationService.getFirestoneLocale(systemLocale);
				console.log('[bootstrap] [localization] setting language from region', locale, systemLocale);
				prefs = { ...prefs, locale: locale, hasChangedLocale: true };
				await this.prefs.savePreferences(prefs);
			}
		}

		return new Promise<void>((resolve) => {
			this.translate.use(prefs.locale).subscribe(async (info) => {
				console.debug('[bootstrap] [localization] language set', prefs.locale, info);
				// await this.translate.use(prefs.locale).toPromise();
				// console.debug('[bootstrap] starting localization service', this.translate);
				await this.localizationService.start(this.translate);
				await this.localizationService.initReady();
				console.debug('[bootstrap] localization service ready');
				await this.localizationFacadeService.init();
				console.debug('[bootstrap] localization facade ready', this.localizationFacadeService);
				resolve();
			});
		});
	}
}
