import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { getNoCardsUrl } from '@firestone/shared/common/service';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { DebugService } from '../../services/debug.service';
import { LocalizationFacadeService } from '../../services/localization-facade.service';

@Component({
	selector: 'loading',
	styleUrls: [`../../../css/component/loading/loading.component.scss`],
	template: `
		<window-wrapper [activeTheme]="'general'">
			<section class="menu-bar">
				<i class="i-117X33 gold-theme logo">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#logo" />
					</svg>
				</i>
				<div class="controls">
					<control-settings></control-settings>
					<control-discord></control-discord>
					<!-- <control-website></control-website> -->
					<button
						class="i-30 pink-button"
						(mousedown)="minimizeWindow()"
						inlineSVG="assets/svg/control_minimize.svg"
					></button>
					<button class="i-30 close-button" (mousedown)="closeWindow()">
						<svg class="svg-icon-fill">
							<use
								xmlns:xlink="https://www.w3.org/1999/xlink"
								xlink:href="assets/svg/sprite.svg#window-control_close"
							></use>
						</svg>
					</button>
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
		</window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // TODO: clean this
})
export class LoadingComponent implements AfterViewInit, OnDestroy {
	title = null;
	loading = true;
	errorMessageKey: string | null = null;
	thisWindowId: string;

	private stateChangedListener: (message: any) => void;
	private messageReceivedListener: (message: any) => void;

	constructor(
		private readonly debugService: DebugService,
		private readonly i18n: LocalizationFacadeService,
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {}

	async ngAfterViewInit() {
		// this.cdr.detach();
		await this.i18n.init();
		console.debug('[loading] i18n initialized', this.i18n.getTranslateService(), this.i18n);
		if (!this.allCards.getCards()?.length) {
			this.title = this.i18n.translateString('app.global.errors.no-cards.title');
			this.errorMessageKey = 'app.global.errors.no-cards.message';
			this.loading = false;
		} else {
			this.title = this.i18n.translateString('loading.getting-ready');
			this.errorMessageKey = null;
			this.messageReceivedListener = this.ow.addMessageReceivedListener((message) => {
				if (message.id === 'ready') {
					this.title = this.i18n.translateString('loading.ready');
					this.loading = false;
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.detectChanges();
					}
				}
			});
		}
		this.thisWindowId = (await this.ow.getCurrentWindow()).id;
		this.positionWindow();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.ow.removeStateChangedListener(this.stateChangedListener);
		this.ow.removeMessageReceivedListener(this.messageReceivedListener);
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		this.ow.dragMove(this.thisWindowId);
	}

	closeWindow() {
		this.ow.closeWindow(this.thisWindowId);
	}

	minimizeWindow() {
		this.ow.minimizeWindow(this.thisWindowId);
	}

	showError() {
		this.ow.openUrlInDefaultBrowser(getNoCardsUrl(this.i18n));
	}

	private async positionWindow() {
		const currentWindow = await this.ow.getCurrentWindow();
		console.debug('[loading] current window', currentWindow);
		// THe user already moved the window, we don't reposition it
		if (currentWindow.isVisible && (currentWindow.left > 0 || currentWindow.top > 0)) {
			return;
		}
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.logicalWidth;
		const gameHeight = gameInfo.logicalHeight;
		const newLeft = ~~(gameWidth * 0.4) - 440;
		const newTop = ~~(gameHeight * 0.1);
		this.ow.changeWindowPosition(this.thisWindowId, newLeft, newTop);
	}
}
