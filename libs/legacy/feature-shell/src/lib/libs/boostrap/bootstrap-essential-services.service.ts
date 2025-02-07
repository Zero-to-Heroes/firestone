import { Injectable, Injector } from '@angular/core';
import { GlobalErrorService } from '@firestone/app/common';
import { DiskCacheService, OwNotificationsService, PreferencesService } from '@firestone/shared/common/service';
import { IndexedDbService, OverwolfService, WindowManagerService } from '@firestone/shared/framework/core';
import { TranslateService } from '@ngx-translate/core';
import { CardsInitService } from '../../js/services/cards-init.service';
import { DebugService } from '../../js/services/debug.service';
import { LocalizationFacadeService } from '../../js/services/localization-facade.service';
import { LocalizationService } from '../../js/services/localization.service';

@Injectable()
export class BootstrapEssentialServicesService {
	// All the constructors are there to start bootstrapping / registering everything
	// The dependency graph should only include services that are in this constructor, and in this specific order
	constructor(
		private readonly injector: Injector,
		private readonly debugService: DebugService, // No deps
		private readonly ow: OverwolfService, // No deps
		private readonly db: IndexedDbService, // No deps
		private readonly windowManager: WindowManagerService, // OverwolfService
		private readonly prefs: PreferencesService, // WindowManager
		private readonly diskCache: DiskCacheService, // Overwolf, Prefs
		// Localization indirectly depend on diskCache because of the loader
		private readonly translate: TranslateService, // No deps
		private readonly localizationService: LocalizationService, // Prefs
	) {}

	public async bootstrapServices(): Promise<void> {
		await this.db.init();
		// Localization needs to be created before other services, so we can show errors
		await this.initLocalization();

		// Bootstrap
		const _notifs = this.injector.get(OwNotificationsService);
		const _globalError = this.injector.get(GlobalErrorService);

		// Wait until all cards are created
		const initCardsService = this.injector.get(CardsInitService);
		await initCardsService.init();
	}

	private async initLocalization() {
		window['translateService'] = this.translate;
		// console.debug('[bootstrap] setting default language');
		// this language will be used as a fallback when a translation isn't found in the current language
		// this.translate.setDefaultLang('enUS');
		// Load the locales first, otherwise some windows will be displayed with missing text
		let prefs = await this.prefs.getPreferences();
		console.log('[bootstrap] [localization] setting language', prefs.locale);
		let locale = prefs.locale;
		if (!prefs.hasChangedLocale) {
			const systemInfo = await this.ow.getSystemInformation();
			console.log('[bootstrap] [localization] system info', systemInfo);
			const systemLocale = systemInfo?.SystemLanguage;
			if (!!systemLocale?.length) {
				locale = this.localizationService.getFirestoneLocale(systemLocale);
				console.log('[bootstrap] [localization] setting language from region', locale, systemLocale);
				prefs = { ...prefs, locale: locale, hasChangedLocale: true };
				await this.prefs.savePreferences(prefs);
			}
		}

		return new Promise<void>((resolve) => {
			console.log('[bootstrap] [localization] preparing to set language', prefs.locale);
			this.translate.use(prefs.locale).subscribe(async (info) => {
				console.log('[bootstrap] [localization] language set', prefs.locale);
				await this.localizationService.start(this.translate);
				await this.localizationService.initReady();
				console.log('[bootstrap] localization service ready');

				const localizationFacadeService = this.injector.get(LocalizationFacadeService);
				await localizationFacadeService.init();
				console.log('[bootstrap] localization facade ready');
				resolve();
			});
		});
	}
}
