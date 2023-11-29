import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	OnDestroy,
	Output,
} from '@angular/core';
import { AnalyticsService, OverwolfService } from '@firestone/shared/framework/core';
import { FeatureFlags } from '../../services/feature-flags';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

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
					(click)="showFeatures()"
					[owTranslate]="'app.global.ads.features-link'"
				></div>
			</div>

			<!-- In large layouts -->
			<div class="ad-container bottom-ads">
				<single-ad
					[adId]="'double'"
					[adSize]="doubleAdSize"
					[tip]="true"
					(adVisibility)="onAdVisibilityChanged($event)"
				></single-ad>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdsComponent extends AbstractSubscriptionStoreComponent implements OnDestroy {
	@Output() adVisibility = new EventEmitter<'hidden' | 'partial' | 'full'>();

	showBottomTip = FeatureFlags.APP_TIPS;
	doubleAdSize = { width: 400, height: 600 };

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
	) {
		super(store, cdr);
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

	onAdVisibilityChanged(visible: 'hidden' | 'partial' | 'full') {
		this.adVisibility.next(visible);
	}
}
