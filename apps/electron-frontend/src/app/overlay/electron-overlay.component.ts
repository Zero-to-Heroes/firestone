import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewRef } from '@angular/core';
import { AllCardsService, SceneMode } from '@firestone-hs/reference-data';
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
			<!-- <constructed-decktracker-ooc-widget-wrapper></constructed-decktracker-ooc-widget-wrapper>
			<decktracker-player-widget-wrapper
				class="focusable"
				style="pointer-events: none;"
				tabindex="0"
			></decktracker-player-widget-wrapper> -->
		</div>
	`,
	styleUrls: ['./electron-overlay.component.scss'],
	changeDetection: ChangeDetectionStrategy.Default,
})
export class ElectronOverlayComponent implements OnInit, OnDestroy {
	gameInfo: any = null;
	tested = false;
	hasElectronAPI = false;
	hasGameInfoMethod = false;

	inGame: boolean | null = null;
	scene: string | null = null;
	memoryUpdates: string | null = null;

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

		// Test legacy ElectronAPI for comparison
		await this.testLegacyElectronAPI();

		// GameStatusService
		this.inGame = await this.gameStatusService.inGame();
		console.log('[ElectronOverlay] Initial game status:', this.inGame);
		const subscription = this.gameStatusService.inGame$$.subscribe((inGame) => {
			console.log('[ElectronOverlay] Game status changed:', inGame);
			this.inGame = inGame;
		});
		this.subscriptions.push(subscription);

		// MemoryUpdatesService
		const memoryUpdatesSubscription = this.memoryUpdateService.memoryUpdates$$.subscribe((memoryUpdates) => {
			// console.log('[ElectronOverlay] Memory updates changed:', memoryUpdates);
			this.memoryUpdates = JSON.stringify(memoryUpdates);
		});
		this.subscriptions.push(memoryUpdatesSubscription);

		// SceneService
		const sceneEnum = this.sceneService.currentScene$$.getValue();
		this.scene = sceneEnum ? SceneMode[sceneEnum] : null;
		console.log('[ElectronOverlay] Initial scene:', this.scene);
		const sceneSubscription = this.sceneService.currentScene$$.subscribe((scene) => {
			console.log('[ElectronOverlay] Scene changed:', scene);
			this.scene = scene ? SceneMode[scene] : null;
		});
		this.subscriptions.push(sceneSubscription);

		await this.init_ScalingService.initializeGlobalScale(true);

		// Set up periodic updates
		this.setupPeriodicUpdates();

		this.ready = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngOnDestroy() {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	private async testLegacyElectronAPI() {
		console.log('[ElectronOverlay] Testing legacy ElectronAPI...');
		console.log('[ElectronOverlay] window.electronAPI:', window.electronAPI);
		console.log('[ElectronOverlay] window.require:', window.require);

		this.hasElectronAPI = !!window.electronAPI;
		this.hasGameInfoMethod = !!window.electronAPI?.getRunningGameInfo;

		// Try electronAPI first
		if (this.hasGameInfoMethod) {
			try {
				this.gameInfo = await window.electronAPI.getRunningGameInfo();
				console.log('[ElectronOverlay] Legacy ElectronAPI result:', this.gameInfo);
			} catch (error) {
				console.error('[ElectronOverlay] Legacy ElectronAPI error:', error);
			}
		}
		// Fallback to direct IPC if nodeIntegration is enabled
		else if (window.require) {
			try {
				console.log('[ElectronOverlay] Trying direct IPC access...');
				const { ipcRenderer } = window.require('electron');
				this.gameInfo = await ipcRenderer.invoke('get-running-game-info');
				console.log('[ElectronOverlay] Direct IPC result:', this.gameInfo);
				this.hasGameInfoMethod = true; // Mark as working
			} catch (error) {
				console.error('[ElectronOverlay] Direct IPC error:', error);
			}
		}

		this.tested = true;
	}

	private setupPeriodicUpdates() {
		// Refresh legacy API every 5 seconds for comparison
		if (this.hasGameInfoMethod || window.require) {
			setInterval(async () => {
				try {
					if (window.electronAPI?.getRunningGameInfo) {
						this.gameInfo = await window.electronAPI.getRunningGameInfo();
					} else if (window.require) {
						const { ipcRenderer } = window.require('electron');
						this.gameInfo = await ipcRenderer.invoke('get-running-game-info');
					}
				} catch (error) {
					console.error('[ElectronOverlay] Refresh error:', error);
				}
			}, 5000);
		}
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
