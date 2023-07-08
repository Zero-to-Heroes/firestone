import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Output,
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
		<div class="ad-container" [ngClass]="{ 'overlay-ad': overlayAd }">
			<div class="no-ads-placeholder">
				<i class="i-117X33 gold-theme logo">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
					</svg>
				</i>
				<ad-tip class="tip" *ngIf="tip"></ad-tip>
			</div>
			<div class="ads" id="ads-div-{{ this.adId }}"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleAdComponent extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
	@Output() adVisibility = new EventEmitter<'hidden' | 'partial' | 'full'>();

	@Input() tip: boolean;
	@Input() adId: string;
	@Input() adSize: { width: number; height: number } = { width: 400, height: 300 };
	@Input() overlayAd = false;

	private adRef;
	private adInit = false;
	private videoImpressionListener: (message: any) => void;
	private playListener: (message: any) => void;
	private displayAdLoadedListener: (message: any) => void;
	private adsReadyListener: (message: any) => void;

	constructor(protected readonly cdr: ChangeDetectorRef, private readonly ow: OverwolfService) {
		super(cdr);
	}

	async ngAfterViewInit() {
		this.initializeAds();
		this.initializeVisibilityCheck();
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		console.log(`[ads-${this.adId}] removing event listeners`);
		this.adRef?.removeEventListener(this.videoImpressionListener);
		this.adRef?.removeEventListener(this.playListener);
		this.adRef?.removeEventListener(this.displayAdLoadedListener);
		this.adRef?.removeEventListener(this.adsReadyListener);
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
				if (this.videoImpressionListener || this.displayAdLoadedListener || this.playListener) {
					console.warn(`[ads-${this.adId}] Redefining the impression listener, could cause memory leaks`);
				}
				this.adInit = true;
				console.log(`[ads-${this.adId}] first time init ads, creating OwAd`);
				this.adRef = new OwAd(document.getElementById(`ads-div-${this.adId}`), {
					size: this.adSize,
				});

				this.displayAdLoadedListener = async (data) => {
					console.log(`[ads-${this.adId}] display ad loaded`);
				};
				this.adsReadyListener = async (data) => {
					console.log(`[ads-${this.adId}] ready to serve ad`);
				};
				this.playListener = async (data) => {
					console.log(`[ads-${this.adId}] play`);
				};
				this.videoImpressionListener = async (data) => {
					// amplitude.getInstance().logEvent('ad', { 'page': this.parentComponent });
					console.log(`[ads-${this.adId}] video impression`);
				};
				// https://overwolf.github.io/api/general/ads-sdk/overwolf-platform/owad
				// Fires when an Ad started "playing" (Video Ad started playing, or display Ad was presented).
				this.adRef.addEventListener('play', this.playListener);
				//     Fires when a Video Ad triggered an Impression. This happens at different intervals depending on the advertiser.
				this.adRef.addEventListener('impression', this.videoImpressionListener);
				// Fires when a Display Ad was served to the container.
				// this event fires when the process to get a billable ad impression starts and not
				// when the actual display ad is served. There are various reasons for not getting a
				// display impression served after the display_ad_loaded event like user
				// history/size/geo/time of day etc. all could affect fill rates.
				this.adRef.addEventListener('display_ad_loaded', this.displayAdLoadedListener);
				// Internal event, should be removed?
				this.adRef.addEventListener('ow_internal_rendered', this.adsReadyListener);

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

	private async initializeVisibilityCheck() {
		setInterval(async () => {
			const visibility = await this.ow.isWindowVisibleToUser();
			this.adVisibility.next(visibility);
		}, 500);
	}
}
