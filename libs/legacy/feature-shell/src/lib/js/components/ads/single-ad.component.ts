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
	standalone: false,

	selector: 'single-ad',

	styleUrls: [`./single-ad.component.scss`],

	template: `
		<div class="ad-container" [ngClass]="{ 'overlay-ad': overlayAd }">
			<div class="no-ads-placeholder">
				<i class="i-117X33 gold-theme logo">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
					</svg>
				</i>

				<ad-tip class="tip" *ngIf="tip && !adPlaying"></ad-tip>
			</div>

			<div class="ads" id="ads-div-{{ this.adId }}"></div>
		</div>
	`,

	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleAdComponent extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
	@Output() adVisibility = new EventEmitter<'hidden' | 'partial' | 'full'>();

	@Output() showHighImpactAd = new EventEmitter<boolean>();

	@Input() tip: boolean;

	@Input() adId: string;

	@Input() adSize: { width: number; height: number } = { width: 400, height: 300 };

	@Input() enableHighImpact: boolean;

	@Input() overlayAd = false;

	/** While true, the rotating ad tip is hidden so it does not show through letterboxing or around the creative. */

	adPlaying = false;

	private adRef;

	private adInit = false;

	/** Set when OwAd fires `player_loaded` before `play` (video path). Display ads do not fire this. */

	private hadVideoPlayerLoaded = false;

	private displayAdTipRestoreTimeout: ReturnType<typeof setTimeout> | null = null;

	private videoImpressionListener: (message: any) => void;
	private playerLoadedListener: (message: any) => void;
	private completeListener: (message: any) => void;
	private errorListener: (message: any) => void;
	private playListener: (message: any) => void;
	private displayAdLoadedListener: (message: any) => void;
	private adsReadyListener: (message: any) => void;
	private highImpactAdLoadedListener: (message: any) => void;
	private highImpactAdRemovedListener: (message: any) => void;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
	) {
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

		this.clearDisplayAdTipRestoreTimeout();
		this.adRef?.removeEventListener(this.playerLoadedListener);
		this.adRef?.removeEventListener(this.completeListener);
		this.adRef?.removeEventListener(this.errorListener);
		this.adRef?.removeEventListener(this.videoImpressionListener);
		this.adRef?.removeEventListener(this.playListener);
		this.adRef?.removeEventListener(this.displayAdLoadedListener);
		this.adRef?.removeEventListener(this.adsReadyListener);
		this.adRef?.removeEventListener(this.highImpactAdLoadedListener);
		this.adRef?.removeEventListener(this.highImpactAdRemovedListener);
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
				if (
					this.videoImpressionListener ||
					this.playerLoadedListener ||
					this.completeListener ||
					this.errorListener ||
					this.displayAdLoadedListener ||
					this.playListener ||
					this.highImpactAdLoadedListener ||
					this.highImpactAdRemovedListener
				) {
					console.warn(`[ads-${this.adId}] Redefining the impression listener, could cause memory leaks`);
				}

				this.adInit = true;

				console.log(`[ads-${this.adId}] first time init ads, creating OwAd`);

				const params = {
					size: this.adSize,

					enableHighImpact: this.enableHighImpact,
				};

				console.log(`[ads-${this.adId}] initializing ads with params`, params);

				this.adRef = new OwAd(document.getElementById(`ads-div-${this.adId}`), params);

				this.displayAdLoadedListener = async (data) => {
					console.log(`[ads-${this.adId}] display ad loaded`);
				};

				this.adsReadyListener = async (data) => {
					console.log(`[ads-${this.adId}] ready to serve ad`);
				};

				this.playerLoadedListener = async () => {
					this.hadVideoPlayerLoaded = true;

					this.clearDisplayAdTipRestoreTimeout();
				};

				this.playListener = async (data) => {
					console.log(`[ads-${this.adId}] play`);

					this.adPlaying = true;

					// `complete` exists for video only; display/banner ads may never fire it, so restore the tip after a bounded delay.

					if (!this.hadVideoPlayerLoaded) {
						this.scheduleDisplayAdTipRestore();
					}

					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.markForCheck();
					}
				};

				this.completeListener = async () => {
					console.log(`[ads-${this.adId}] complete`);

					this.onAdPlaybackEnded();
				};

				this.errorListener = async () => {
					console.log(`[ads-${this.adId}] error`);

					this.onAdPlaybackEnded();
				};

				this.videoImpressionListener = async (data) => {
					console.log(`[ads-${this.adId}] video impression`);
				};

				this.highImpactAdLoadedListener = async (data) => {
					console.log(`[ads-${this.adId}] high impact ad loaded`);

					this.showHighImpactAd.next(true);
				};

				this.highImpactAdRemovedListener = async (data) => {
					console.log(`[ads-${this.adId}] high impact ad removed`);

					this.showHighImpactAd.next(false);
				};

				// https://overwolf.github.io/api/general/ads-sdk/overwolf-platform/owad

				this.adRef.addEventListener('player_loaded', this.playerLoadedListener);

				// Fires when an Ad started "playing" (Video Ad started playing, or display Ad was presented).

				this.adRef.addEventListener('play', this.playListener);

				// Video only: fires when the video finished (used to show the tip again).

				this.adRef.addEventListener('complete', this.completeListener);

				this.adRef.addEventListener('error', this.errorListener);

				//     Fires when a Video Ad triggered an Impression. This happens at different intervals depending on the advertiser.

				this.adRef.addEventListener('impression', this.videoImpressionListener);

				// Fires when a Display Ad was served to the container.

				// this event fires when the process to get a billable ad impression starts and not

				// when the actual display ad is served. There are various reasons for not getting a

				// display impression served after the display_ad_loaded event like user

				// history/size/geo/time of day etc. all could affect fill rates.

				this.adRef.addEventListener('display_ad_loaded', this.displayAdLoadedListener);

				this.adRef.addEventListener('high-impact-ad-loaded', this.highImpactAdLoadedListener);

				this.adRef.addEventListener('high-impact-ad-removed', this.highImpactAdRemovedListener);

				// Internal event, should be removed?

				this.adRef.addEventListener('ow_internal_rendered', this.adsReadyListener);

				console.log(`[ads-${this.adId}] init OwAd`);

				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.markForCheck();
				}

				this.adInit = false;

				return;
			}

			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.markForCheck();
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

	private onAdPlaybackEnded(): void {
		this.adPlaying = false;

		this.hadVideoPlayerLoaded = false;

		this.clearDisplayAdTipRestoreTimeout();

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	private scheduleDisplayAdTipRestore(): void {
		this.clearDisplayAdTipRestoreTimeout();

		this.displayAdTipRestoreTimeout = setTimeout(() => {
			this.displayAdTipRestoreTimeout = null;

			this.onAdPlaybackEnded();
		}, 60_000);
	}

	private clearDisplayAdTipRestoreTimeout(): void {
		if (this.displayAdTipRestoreTimeout != null) {
			clearTimeout(this.displayAdTipRestoreTimeout);

			this.displayAdTipRestoreTimeout = null;
		}
	}
}
