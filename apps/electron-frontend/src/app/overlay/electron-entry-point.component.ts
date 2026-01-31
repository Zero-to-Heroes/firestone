import { Injectable, OnInit } from '@angular/core';
import { AllCardsService } from '@firestone-hs/reference-data';
import { PreferencesService, ScalingService } from '@firestone/shared/common/service';
import {
	AppInjector,
	CardsFacadeStandaloneService,
	ILocalizationService,
	LocalizationStandaloneService,
} from '@firestone/shared/framework/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export abstract class ElectronEntryPointComponent implements OnInit {
	protected readonly init_ScalingService: ScalingService;
	protected readonly allCards: CardsFacadeStandaloneService;
	protected readonly i18n: ILocalizationService;
	protected readonly prefs: PreferencesService;
	protected readonly translate: TranslateService;
	protected readonly localizationService: LocalizationStandaloneService;

	constructor() {
		this.init_ScalingService = AppInjector.get(ScalingService);
		this.allCards = AppInjector.get(CardsFacadeStandaloneService);
		this.i18n = AppInjector.get(ILocalizationService);
		this.prefs = AppInjector.get(PreferencesService);
		this.translate = AppInjector.get(TranslateService);
		this.localizationService = AppInjector.get(LocalizationStandaloneService);
	}

	async ngOnInit() {
		const service = new AllCardsService();
		await service.initializeCardsDb();
		await this.allCards.init(service, 'enUS');

		await this.initLocalization();
	}

	private async initLocalization() {
		// console.debug('[bootstrap] setting default language');
		// this language will be used as a fallback when a translation isn't found in the current language
		// this.translate.setDefaultLang('enUS');
		// Load the locales first, otherwise some windows will be displayed with missing text
		let prefs = await this.prefs.getPreferences();
		console.log('[i18n] setting language', prefs.locale);

		return new Promise<void>((resolve) => {
			console.log('[i18n] preparing to set language', prefs.locale);
			this.translate.use(prefs.locale).subscribe(async (info) => {
				console.log('[i18n] language set', prefs.locale);
				// await this.localizationService.start(this.translate);
				await this.localizationService.setLocale(prefs.locale);
				console.log('[i18n] localization service ready');

				resolve();
			});
		});
	}
}
