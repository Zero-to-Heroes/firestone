import {
	Component,
	ViewEncapsulation,
	HostListener,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	ViewRef,
} from '@angular/core';

import { DebugService } from '../../services/debug.service';
import { AdService } from '../../services/ad.service';
import { OverwolfService } from '../../services/overwolf.service';

declare var ga: any;
declare var adsReady: any;
declare var OwAd: any;

@Component({
	selector: 'loading',
	styleUrls: [`../../../css/global/components-global.scss`, `../../../css/component/loading/loading.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="top">
			<div class="root">
				<div class="app-container">
					<section class="menu-bar">
						<i class="i-117X33 gold-theme logo">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#logo" />
							</svg>
						</i>
						<div class="controls">
							<control-settings [windowId]="thisWindowId"></control-settings>
							<control-discord></control-discord>
							<button class="i-30 pink-button" (mousedown)="minimizeWindow()">
								<svg class="svg-icon-fill">
									<use
										xmlns:xlink="http://www.w3.org/1999/xlink"
										xlink:href="/Files/assets/svg/sprite.svg#window-control_minimize"
									></use>
								</svg>
							</button>
							<button class="i-30 close-button" (mousedown)="closeWindow()">
								<svg class="svg-icon-fill">
									<use
										xmlns:xlink="http://www.w3.org/1999/xlink"
										xlink:href="/Files/assets/svg/sprite.svg#window-control_close"
									></use>
								</svg>
							</button>
						</div>
					</section>
					<section class="content-container">
						<div class="app-title">
							<i class="i-35 gold-theme left">
								<svg class="svg-icon-fill">
									<use xlink:href="/Files/assets/svg/sprite.svg#title_decor" />
								</svg>
							</i>
							<span class="title">{{ title }}</span>
							<i class="i-35 gold-theme right">
								<svg class="svg-icon-fill">
									<use xlink:href="/Files/assets/svg/sprite.svg#title_decor" />
								</svg>
							</i>
						</div>
						<i class="i-54 loading-icon gold-theme" *ngIf="loading">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#loading_spiral" />
							</svg>
						</i>
						<div class="sub-title" *ngIf="!loading">
							<span>Hit</span>
							<hotkey></hotkey>
							<span>to view the app</span>
						</div>
					</section>
				</div>

				<i class="i-54 gold-theme corner top-left">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
					</svg>
				</i>
				<i class="i-54 gold-theme corner top-right">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
					</svg>
				</i>
				<i class="i-54 gold-theme corner bottom-right">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
					</svg>
				</i>
				<i class="i-54 gold-theme corner bottom-left">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#golden_corner" />
					</svg>
				</i>
			</div>
			<div class="ads-container">
				<div class="no-ads-placeholder">
					<i class="i-117X33 gold-theme logo">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#ad_placeholder" />
						</svg>
					</i>
				</div>
				<div class="ads" id="ad-div" #ads></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent implements AfterViewInit {
	title = 'Getting ready';
	loading = true;
	thisWindowId: string;

	private adRef;
	private adInit;

	constructor(
		private debugService: DebugService,
		private adService: AdService,
		private ow: OverwolfService,
		private cdr: ChangeDetectorRef,
	) {}

	async ngAfterViewInit() {
		this.cdr.detach();
		this.thisWindowId = (await this.ow.getCurrentWindow()).id;
		this.positionWindow();
		this.ow.addMessageReceivedListener(message => {
			console.log('received', message);
			if (message.id === 'ready') {
				this.title = 'Your abilities are ready!';
				this.loading = false;
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			}
		});
		this.ow.addStateChangedListener('LoadingWindow', message => {
			if (message.window_state !== 'normal') {
				console.log('removing ad', message.window_state);
				this.removeAds();
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			} else {
				console.log('refreshing ad', message.window_state);
				this.refreshAds();
			}
		});
		this.refreshAds();
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		this.ow.dragMove(this.thisWindowId);
	}

	closeWindow() {
		if (this.loading) {
			ga('send', 'event', 'loading', 'closed-before-complete');
		}
		this.ow.closeWindow(this.thisWindowId);
	}

	minimizeWindow() {
		this.ow.minimizeWindow(this.thisWindowId);
	}

	private async refreshAds() {
		const shouldDisplayAds = await this.adService.shouldDisplayAds();
		if (!shouldDisplayAds) {
			console.log('ad-free app, not showing ads and returning');
			return;
		}
		if (this.adInit) {
			console.log('already initializing ads, returning');
			return;
		}
		if (!adsReady || !OwAd) {
			console.log('ads container not ready, returning');
			setTimeout(() => {
				this.refreshAds();
			}, 50);
			return;
		}
		if (!this.adRef) {
			this.adInit = true;
			const window = await this.ow.getCurrentWindow();
			if (window.isVisible) {
				console.log('first time init ads, creating OwAd', adsReady);
				this.adRef = new OwAd(document.getElementById('ad-div'));
				this.adRef.addEventListener('impression', data => {
					ga('send', 'event', 'ad', 'loading-window');
				});
				console.log('init OwAd');
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			}
			this.adInit = false;
			this.refreshAds();
			return;
		}
		console.log('refreshing ads');
		this.adRef.refreshAd();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private removeAds() {
		if (!this.adRef) {
			return;
		}
		console.log('removing ads');
		this.adRef.removeAd();
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async positionWindow() {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameWidth = gameInfo.logicalWidth;
		const gameHeight = gameInfo.logicalHeight;
		const newLeft = ~~(gameWidth * 0.4) - 440;
		const newTop = ~~(gameHeight * 0.1);
		console.log('changing loading window position', this.thisWindowId, newLeft, newTop);
		this.ow.changeWindowPosition(this.thisWindowId, newLeft, newTop);
	}
}
