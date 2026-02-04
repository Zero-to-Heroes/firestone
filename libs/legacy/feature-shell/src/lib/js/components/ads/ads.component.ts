import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Inject,
	OnDestroy,
	Output,
	ViewRef,
} from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, AnalyticsService, IAdsService, OverwolfService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'ads',
	styleUrls: [`../../../css/component/ads/ads.component.scss`],
	template: `
		<div class="ads">
			<div class="banner-container" *ngIf="!showingHighImpactAd">
				<div class="unlock-premium-banner" (click)="showSubscription()">
					<div class="background"></div>
					<div class="background-gradient"></div>
					<div class="content">
						<div class="text">
							<span class="main-text" [owTranslate]="'app.global.ads.unlock-text'"></span>
							<span class="sub-text" [owTranslate]="'app.global.ads.unlock-subtext'"></span>
						</div>
						<button class="cta" [owTranslate]="'app.global.ads.cta-text'"></button>
					</div>
				</div>
				<div
					class="features-link"
					(click)="showFeatures()"
					[owTranslate]="'app.global.ads.features-link'"
				></div>
			</div>

			<!-- In large layouts -->
			<div class="ad-container bottom-ads">
				<single-ad
					(showHighImpactAd)="onShowHighImpactAd($event)"
					[adId]="'double'"
					[adSize]="doubleAdSize"
					[enableHighImpact]="true"
					[tip]="true"
					(adVisibility)="onAdVisibilityChanged($event)"
				></single-ad>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdsComponent extends AbstractSubscriptionComponent implements OnDestroy, AfterContentInit {
	@Output() adVisibility = new EventEmitter<'hidden' | 'partial' | 'full'>();

	doubleAdSize = { width: 400, height: 600 };
	showingHighImpactAd = false;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
	}

	showSubscription() {
		this.analytics.trackEvent('subscription-click', { page: 'banner' });
		this.ads.goToPremium();
	}

	showFeatures() {
		this.ow.openUrlInDefaultBrowser('https://github.com/Zero-to-Heroes/firestone/wiki/Premium-features');
		this.analytics.trackEvent('show-premium-features');
	}

	openBazaarTrackerPage() {
		console.log('[cross-promotion] opening BazaarTracker page');
		this.ow.openUrlInDefaultBrowser('https://www.overwolf.com/app/Sebastien_Tromp-BazaarTracker');
	}

	onAdVisibilityChanged(visible: 'hidden' | 'partial' | 'full') {
		this.adVisibility.next(visible);
	}

	onShowHighImpactAd(showing: boolean) {
		this.showingHighImpactAd = showing;
		this.cdr.markForCheck();
	}
}
