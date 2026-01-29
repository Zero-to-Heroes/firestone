import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewRef } from '@angular/core';
import { AllCardsService } from '@firestone-hs/reference-data';
import { MemoryUpdatesService, SceneService } from '@firestone/memory';
import { GameStatusService, PreferencesService, ScalingService } from '@firestone/shared/common/service';
import {
	CardsFacadeStandaloneService,
	ILocalizationService,
	LocalizationStandaloneService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

declare const window: any;

@Component({
	selector: 'electron-overlay',
	standalone: false,
	template: `
		<div class="electron-overlay-container">
			<full-screen-overlays *ngIf="ready"></full-screen-overlays>
		</div>
	`,
	styleUrls: ['./electron-overlay.component.scss'],
	changeDetection: ChangeDetectionStrategy.Default,
})
export class ElectronOverlayComponent implements OnInit, OnDestroy {
	ready = false;

	private subscriptions: Subscription[] = [];

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly gameStatusService: GameStatusService,
		private readonly sceneService: SceneService,
		private readonly memoryUpdateService: MemoryUpdatesService,
		private readonly allCards: CardsFacadeStandaloneService,
		private readonly i18n: ILocalizationService,
		private readonly init_ScalingService: ScalingService,
		private readonly prefs: PreferencesService,
		private readonly translate: TranslateService,
		private readonly localizationService: LocalizationStandaloneService,
		// private readonly injector: Injector,
	) {}

	async ngOnInit() {
		console.log('[ElectronOverlay] Initializing...');

		console.log('[ElectronOverlay] Initializing cards...');
		const service = new AllCardsService();
		await service.initializeCardsDb();
		await this.allCards.init(service, 'enUS');
		console.log('[ElectronOverlay] Cards initialized...');

		console.log('[i18n] [ElectronOverlay] Initializing localization...');
		await this.initLocalization();
		console.log('[i18n] [ElectronOverlay] Localization initialized...');

		await waitForReady(this.gameStatusService, this.memoryUpdateService);

		this.init_ScalingService.subscribeToWindowHeight(true);

		this.ready = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngOnDestroy() {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
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
