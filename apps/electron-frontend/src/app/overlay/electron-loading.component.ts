import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Inject,
	OnDestroy,
	OnInit,
	ViewRef,
} from '@angular/core';
import { getNoCardsUrl } from '@firestone/shared/common/service';
import {
	EXTERNAL_URL_SERVICE_TOKEN,
	IExternalUrlService,
} from '@firestone/shared/framework/core';
import { ElectronEntryPointComponent } from './electron-entry-point.component';

@Component({
	standalone: false,
	selector: 'electron-loading',
	styleUrls: [`./electron-loading.component.scss`],
	template: `
		<electron-window-wrapper [activeTheme]="'general'" [allowResize]="false" *ngIf="ready">
			<section class="menu-bar">
				<i class="i-117X33 gold-theme logo">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#logo" />
					</svg>
				</i>
				<div class="controls">
					<control-settings></control-settings>
					<control-discord></control-discord>
					<control-minimize></control-minimize>
					<control-close></control-close>
				</div>
			</section>
			<section class="content-container">
				<div class="app-title">
					<i class="i-35 gold-theme left">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#title_decor" />
						</svg>
					</i>
					<span class="title">{{ title }}</span>
					<i class="i-35 gold-theme right">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#title_decor" />
						</svg>
					</i>
				</div>
				<i class="i-54 loading-icon gold-theme" *ngIf="loading">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#loading_spiral" />
					</svg>
				</i>
				<div class="sub-title" *ngIf="!loading">
					<span
						class="error-message"
						*ngIf="errorMessageKey"
						[owTranslate]="errorMessageKey"
						(click)="showError()"
					></span>
					<span *ngIf="!errorMessageKey" [owTranslate]="'loading.hotkey'"></span>
					<hotkey *ngIf="!errorMessageKey"></hotkey>
				</div>
			</section>
			<single-ad [adId]="'loading'" class="ads"></single-ad>
		</electron-window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElectronLoadingComponent extends ElectronEntryPointComponent implements OnInit, OnDestroy {
	ready = false;
	title: string | null = null;
	loading = true;
	errorMessageKey: string | null = null;

	private readyListener: (() => void) | null = null;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		@Inject(EXTERNAL_URL_SERVICE_TOKEN) private readonly externalUrl: IExternalUrlService,
	) {
		super();
	}

	async ngOnInit() {
		await super.ngOnInit();

		document.title = 'Firestone Loading';

		if (!this.allCards.getCards()?.length) {
			this.title = this.i18n.translateString('app.global.errors.no-cards.title');
			this.errorMessageKey = 'app.global.errors.no-cards.message';
			this.loading = false;
		} else {
			this.title = this.i18n.translateString('loading.getting-ready');
			this.errorMessageKey = null;
			this.listenForReady();
		}

		this.ready = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.removeReadyListener();
	}

	showError() {
		this.externalUrl.openUrlInDefaultBrowser(getNoCardsUrl(this.i18n));
	}

	private listenForReady(): void {
		try {
			const { ipcRenderer } = (window as any).require('electron');
			const applyReady = () => {
				this.title = this.i18n.translateString('loading.ready');
				this.loading = false;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.markForCheck();
				}
			};
			this.readyListener = applyReady;
			ipcRenderer.on('loading-ready', this.readyListener);
			// Main may have already sent ready before Angular finished booting
			void ipcRenderer.invoke('loading-window-get-ready-state').then((alreadyReady: boolean) => {
				if (alreadyReady) {
					applyReady();
				}
			});
		} catch (e) {
			console.error('[electron-loading] Failed to listen for loading-ready', e);
		}
	}

	private removeReadyListener(): void {
		if (!this.readyListener) {
			return;
		}
		try {
			const { ipcRenderer } = (window as any).require('electron');
			ipcRenderer.removeListener('loading-ready', this.readyListener);
		} catch (_) {}
		this.readyListener = null;
	}
}
