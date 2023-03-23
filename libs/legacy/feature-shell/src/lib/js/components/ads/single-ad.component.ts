import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService } from '@firestone/shared/framework/core';

declare let adsReady: any;
declare let OwAd: any;

@Component({
	selector: 'single-ad',
	styleUrls: [`../../../css/component/ads/single-ad.component.scss`],
	template: `
		<div class="ad-container">
			<div class="no-ads-placeholder">
				<i class="i-117X33 gold-theme logo">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
					</svg>
				</i>
				<div class="tip" *ngIf="tip" [innerHTML]="tip"></div>
			</div>
			<div class="ads" id="ads-div-{{ this.adId }}"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleAdComponent extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
	@Input() tip: string;
	@Input() adId: string;

	private adRef;
	private adInit = false;
	private impressionListener: (message: any) => void;
	private displayAdLoadedListener: (message: any) => void;
	private owAdsReadyListener: (message: any) => void;

	constructor(protected readonly cdr: ChangeDetectorRef, private ow: OverwolfService) {
		super(cdr);
	}

	async ngAfterViewInit() {
		this.initializeAds();
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		console.log(`[ads-${this.adId}] removing event listeners`);
		this.adRef?.removeEventListener(this.impressionListener);
		this.adRef?.removeEventListener(this.displayAdLoadedListener);
		this.adRef?.removeEventListener(this.owAdsReadyListener);
	}

	private async initializeAds() {
		try {
			if (this.adInit) {
				console.log(`[ads-${this.adId}] already initializing ads, returning`);
				return;
			}
			if (!adsReady || !OwAd) {
				console.log(`[ads-${this.adId}] ads container not ready, returning`);
				setTimeout(() => {
					this.initializeAds();
				}, 1000);
				return;
			}
			if (!document.getElementById(`ads-div-${this.adId}`)) {
				console.log(`[ads-${this.adId}] ads-video not ready, returning`);
				setTimeout(() => {
					this.initializeAds();
				}, 1000);
				return;
			}
			if (!this.adRef) {
				if (this.impressionListener || this.displayAdLoadedListener) {
					console.warn(
						`[ads-${this.adId}] Redefining the impression listener, could cause memory leaks`,
						this.impressionListener,
						this.displayAdLoadedListener,
					);
				}
				this.adInit = true;
				console.log(`[ads-${this.adId}] first time init ads, creating OwAd`);
				this.adRef = new OwAd(document.getElementById(`ads-div-${this.adId}`));

				this.impressionListener = async (data) => {
					// amplitude.getInstance().logEvent('ad', { 'page': this.parentComponent });
					console.log(`[ads-${this.adId}] impression`);
				};
				this.displayAdLoadedListener = async (data) => {
					console.log(`[ads-${this.adId}] display ad loaded`);
				};
				this.owAdsReadyListener = async (data) => {
					console.log(`[ads-${this.adId}] ready to serve ad`);
				};
				this.adRef.addEventListener('impression', this.impressionListener);
				this.adRef.addEventListener('display_ad_loaded', this.displayAdLoadedListener);
				this.adRef.addEventListener('ow_internal_rendered', this.owAdsReadyListener);

				console.log(`[ads-${this.adId}] init OwAd`);
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
				this.adInit = false;
				return;
			}
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		} catch (e) {
			console.warn(`[ads-${this.adId}] exception while initializing ads, retrying`, e);
			setTimeout(() => {
				this.initializeAds();
			}, 10000);
		}
	}
}
