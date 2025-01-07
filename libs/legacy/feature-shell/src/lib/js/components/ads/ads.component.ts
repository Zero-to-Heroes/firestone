import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	OnDestroy,
	Output,
	ViewRef,
} from '@angular/core';
import { CrossPromotionService } from '@firestone/app/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { AnalyticsService, OverwolfService } from '@firestone/shared/framework/core';
import { FeatureFlags } from '../../services/feature-flags';

@Component({
	selector: 'ads',
	styleUrls: [`../../../css/component/ads/ads.component.scss`],
	template: `
		<div class="ads">
			<div class="banner-container">
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
					*ngIf="!showBazaarTrackerAd"
					(click)="showFeatures()"
					[owTranslate]="'app.global.ads.features-link'"
				></div>
				<div class="features-link" *ngIf="showBazaarTrackerAd" (click)="openBazaarTrackerPage()">
					Get BazaarTracker on Overwolf
				</div>
			</div>

			<!-- In large layouts -->
			<div class="ad-container bottom-ads">
				<single-ad
					[adId]="'double'"
					[adSize]="doubleAdSize"
					[tip]="true"
					[showBazaarTrackerAd]="showBazaarTrackerAd"
					(adVisibility)="onAdVisibilityChanged($event)"
				></single-ad>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdsComponent extends AbstractSubscriptionComponent implements OnDestroy, AfterContentInit {
	@Output() adVisibility = new EventEmitter<'hidden' | 'partial' | 'full'>();

	showBottomTip = FeatureFlags.APP_TIPS;
	doubleAdSize = { width: 400, height: 600 };
	showBazaarTrackerAd = false;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
		private readonly crossPromotion: CrossPromotionService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		const isBazaarInstalled = await this.crossPromotion.isBazaarInstalled();
		const isBazaarTrackerInstalled = await this.crossPromotion.isBazaarTrackerInstalled();
		console.debug('[cross-promotion] bazaar installed', isBazaarInstalled, isBazaarTrackerInstalled);
		this.showBazaarTrackerAd = isBazaarInstalled && !isBazaarTrackerInstalled;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
	}

	showSubscription() {
		this.analytics.trackEvent('subscription-click', { page: 'banner' });
		this.ow.openStore();
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
}
