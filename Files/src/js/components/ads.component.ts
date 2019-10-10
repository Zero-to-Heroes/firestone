import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { AdService } from '../services/ad.service';
import { OverwolfService } from '../services/overwolf.service';

declare var adsReady: any;
declare var OwAd: any;
declare var ga: any;

@Component({
	selector: 'ads',
	styleUrls: [`../../css/global/components-global.scss`, `../../css/component/ads.component.scss`],
	template: `
		<div class="ads-container">
			<div class="no-ads-placeholder">
				<i class="i-117X33 gold-theme logo">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#ad_placeholder" />
					</svg>
				</i>
			</div>
			<div class="ads" id="ad-div"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdsComponent implements AfterViewInit, OnDestroy {
	@Input() parentComponent: string;

	windowId: string;

	private adRef;
	private adInit = false;
	private shouldDisplayAds = true;
	private stateChangedListener: (message: any) => void;
	private impressionListener: (message: any) => void;

	constructor(
		private cdr: ChangeDetectorRef,
		private logger: NGXLogger,
		private adService: AdService,
		private ow: OverwolfService,
	) {}

	async ngAfterViewInit() {
		this.cdr.detach();
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.stateChangedListener = this.ow.addStateChangedListener('CollectionWindow', message => {
			if (message.window_state !== 'normal' && message.window_state !== 'maximized') {
				this.logger.info('[ads] removing ad', message.window_state);
				this.removeAds();
			} else if (message.window_previous_state !== 'normal' && message.window_previous_state !== 'maximized') {
				this.logger.info('[ads] refreshing ad', message.window_state, message);
				this.refreshAds();
			}
		});
		this.shouldDisplayAds = await this.adService.shouldDisplayAds();
		this.refreshAds();
	}

	ngOnDestroy(): void {
		this.ow.removeStateChangedListener(this.stateChangedListener);
		this.adRef.removeEventListener(this.impressionListener);
	}

	private async refreshAds() {
		try {
			this.logger.info('[ads] refreshing ads');
			if (!this.shouldDisplayAds) {
				this.logger.info('[ads] ad-free app, not showing ads and returning');
				return;
			}
			if (this.adInit) {
				this.logger.info('[ads] already initializing ads, returning');
				return;
			}
			if (!adsReady || !OwAd) {
				this.logger.info('[ads] ads container not ready, returning');
				setTimeout(() => {
					this.refreshAds();
				}, 1000);
				return;
			}
			if (!document.getElementById('ad-div')) {
				this.logger.info('[ads] ad-div not ready, returning');
				setTimeout(() => {
					this.refreshAds();
				}, 1000);
				return;
			}
			if (!this.adRef) {
				if (this.impressionListener) {
					console.warn(
						'[ads] Redefining the impression listener, could cause memory leaks',
						this.impressionListener,
					);
				}
				this.adInit = true;
				const window = await this.ow.getCurrentWindow();
				if (window.isVisible) {
					this.logger.info('[ads] first time init ads, creating OwAd');
					this.adRef = new OwAd(document.getElementById('ad-div'));
					this.impressionListener = data => {
						ga('send', 'event', 'ad', this.parentComponent);
					};
					this.adRef.addEventListener('impression', this.impressionListener);
					this.logger.info('[ads] init OwAd');
					if (!(this.cdr as ViewRef).destroyed) {
						this.cdr.detectChanges();
					}
				}
				this.adInit = false;
				setTimeout(() => {
					this.refreshAds();
				}, 1000);
				return;
			}
			this.logger.info('[ads] refreshed ads');
			this.adRef.refreshAd();
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		} catch (e) {
			this.logger.warn('[ads] exception while initializing ads, retrying', e);
			setTimeout(() => {
				this.refreshAds();
			}, 2000);
		}
	}

	private removeAds() {
		if (!this.adRef) {
			return;
		}
		this.logger.info('removing ads');
		this.adRef.removeAd();
	}
}
