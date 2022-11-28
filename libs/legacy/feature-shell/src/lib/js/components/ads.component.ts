import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdService } from '../services/ad.service';
import { MainWindowStoreEvent } from '../services/mainwindow/store/events/main-window-store-event';
import { ShowAdsEvent } from '../services/mainwindow/store/events/show-ads-event';
import { OverwolfService } from '../services/overwolf.service';
import { TipService } from '../services/tip.service';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from './abstract-subscription.component';

declare let adsReady: any;
declare let OwAd: any;
declare let amplitude: any;

// const REFRESH_IN_MINUTES = 6;
// const REFRESH_CAP = 5;

@Component({
	selector: 'ads',
	styleUrls: [`../../css/global/reset-styles.scss`, `../../css/component/ads.component.scss`],
	template: `
		<div class="ads-container">
			<div
				class="subscription-link"
				*ngIf="shouldDisplayAds"
				(click)="showSubscription()"
				[owTranslate]="'app.global.ads.support-the-dev'"
			></div>
			<div class="thank-you-link" *ngIf="!shouldDisplayAds" [owTranslate]="'app.global.ads.supporter'"></div>
			<div class="no-ads-placeholder">
				<i class="i-117X33 gold-theme logo">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
					</svg>
				</i>
				<div class="tip" *ngIf="tip$ | async as tip" [innerHTML]="tip"></div>
			</div>
			<div class="ads" id="ad-div"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdsComponent extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
	tip$: Observable<string>;

	@Input() parentComponent: string;

	@Input() set adRefershToken(value: any) {
		// if (!value || this.forceRefreshToken === value || this.refreshesLeft === REFRESH_CAP) {
		// 	return;
		// }
		// console.log('[ads] forcing refresh', value, this.forceRefreshToken, this.refreshesLeft);
		// this.forceRefreshToken = value;
		// this.refreshesLeft = REFRESH_CAP;
		// this.tentativeAdRefresh();
	}

	shouldDisplayAds = true;

	private windowId: string;
	// private forceRefreshToken: any;

	private adRef;
	private adInit = false;
	private owAdsReady = false;
	private stateChangedListener: (message: any) => void;
	private impressionListener: (message: any) => void;
	private displayImpressionListener: (message: any) => void;
	private owAdsReadyListener: (message: any) => void;
	// private refreshTimer;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	// private refreshesLeft = REFRESH_CAP;

	private tip = new BehaviorSubject<string>(null);
	private tipInterval;

	constructor(
		private adService: AdService,
		private ow: OverwolfService,
		private readonly tipService: TipService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	async ngAfterViewInit() {
		// this.cdr.detach();
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		this.stateChangedListener = this.ow.addStateChangedListener(this.windowId, (message) => {
			if (message.window_state !== 'normal' && message.window_state !== 'maximized') {
				console.log('[ads] removing ad', message.window_state);
				this.removeAds();
			} else if (message.window_previous_state !== 'normal' && message.window_previous_state !== 'maximized') {
				console.log('[ads] refreshing ad', message.window_state, message.window_previous_state, message);
				this.refreshAds();
			}
		});
		this.shouldDisplayAds = await this.adService.shouldDisplayAds();
		console.log('[ads] should display ads?', this.shouldDisplayAds);
		this.stateUpdater.next(new ShowAdsEvent(this.shouldDisplayAds));
		this.refreshAds();
		this.tip$ = this.tip.asObservable().pipe(this.mapData((tip) => tip));
		this.tipInterval = setInterval(() => {
			this.tip.next(this.tipService.getRandomTip());
		}, 30000);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		console.log('[ads] removing event listeners');
		this.ow.removeStateChangedListener(this.stateChangedListener);
		this.adRef?.removeEventListener(this.impressionListener);
		this.adRef?.removeEventListener(this.displayImpressionListener);
		this.adRef?.removeEventListener(this.owAdsReadyListener);
		if (this.tipInterval) {
			clearInterval(this.tipInterval);
		}
	}

	showSubscription() {
		amplitude.getInstance().logEvent('subscription-click', { 'page': 'banner' });
		this.ow.openStore();
	}

	private async tentativeAdRefresh() {
		const window = await this.ow.getCurrentWindow();
		if (window.isVisible) {
			this.refreshAds();
		}
	}

	private async refreshAds() {
		try {
			if (!this.shouldDisplayAds) {
				console.log('[ads] ad-free app, not showing ads and returning');
				return;
			}
			if (this.adInit) {
				console.log('[ads] already initializing ads, returning');
				return;
			}
			if (!adsReady || !OwAd) {
				console.log('[ads] ads container not ready, returning');
				setTimeout(() => {
					this.refreshAds();
				}, 1000);
				return;
			}
			if (!document.getElementById('ad-div')) {
				console.log('[ads] ad-div not ready, returning');
				setTimeout(() => {
					this.refreshAds();
				}, 1000);
				return;
			}
			if (!this.adRef) {
				if (this.impressionListener || this.displayImpressionListener) {
					console.warn(
						'[ads] Redefining the impression listener, could cause memory leaks',
						this.impressionListener,
						this.displayImpressionListener,
					);
				}
				this.adInit = true;
				const window = await this.ow.getCurrentWindow();
				if (window.isVisible) {
					console.log('[ads] first time init ads, creating OwAd');
					this.owAdsReady = false;
					this.adRef = new OwAd(document.getElementById('ad-div'));

					this.impressionListener = async (data) => {
						// amplitude.getInstance().logEvent('ad', { 'page': this.parentComponent });
						console.log('[ads] impression');
					};
					this.adRef.addEventListener('impression', this.impressionListener);

					this.displayImpressionListener = async (data) => {
						console.log('[ads] display ad impression');
						// We accept to refresh the ads every 7 minutes, to make it possible to have a video ad
						// impression
						// if (!this.refreshTimer) {
						// 	if (this.refreshesLeft > 0) {
						// 		this.refreshTimer = setTimeout(() => {
						// 			console.log(`[ads] refreshing ad after ${REFRESH_IN_MINUTES} minutes timeout`);
						// 			this.refreshTimer = null;
						// 			this.refreshesLeft--;
						// 			this.refreshAds();
						// 		}, REFRESH_IN_MINUTES * 60 * 1000);
						// 	}
						// }
					};
					this.owAdsReadyListener = async (data) => {
						// console.log('[ads] owAdsReady', data);
						this.owAdsReady = true;
					};
					this.adRef.addEventListener('display_ad_loaded', this.displayImpressionListener);
					this.adRef.addEventListener('ow_internal_rendered', this.owAdsReadyListener);

					console.log('[ads] init OwAd');
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.detectChanges();
					}
				}
				this.adInit = false;
				setTimeout(() => {
					this.refreshAds();
				}, 1000);
				return;
			}
			if (this.owAdsReady) {
				console.log('[ads] refreshed ads');
				this.adRef.refreshAd();
			} else {
				console.log('[ads] ads not ready yet, not refreshing ads');
			}
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		} catch (e) {
			console.warn('[ads] exception while initializing ads, retrying', e);
			setTimeout(() => {
				this.refreshAds();
			}, 10000);
		}
	}

	private removeAds() {
		// if (this.refreshTimer) {
		// 	clearTimeout(this.refreshTimer);
		// 	this.refreshTimer = null;
		// }
		if (!this.adRef) {
			return;
		}
		console.log('[ads] removing ads');
		this.adRef.removeAd();
	}
}
