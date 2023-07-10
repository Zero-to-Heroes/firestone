import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Output,
} from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { FeatureFlags } from '../../services/feature-flags';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

declare let amplitude: any;

@Component({
	selector: 'ads',
	styleUrls: [`../../../css/component/ads/ads.component.scss`],
	template: `
		<div class="ads">
			<div class="ad-container top-ads" *ngIf="showTopAd">
				<single-ad [adId]="'top'" [adSize]="topAdSize"></single-ad>
			</div>

			<div class="banner-container">
				<div class="unlock-premium-banner" (click)="showSubscription()" *ngIf="showTopAd">
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

			<div class="ad-container bottom-ads">
				<single-ad
					[adId]="'bottom'"
					[tip]="showBottomTip"
					(adVisibility)="onAdVisibilityChanged($event)"
				></single-ad>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdsComponent extends AbstractSubscriptionStoreComponent implements OnDestroy {
	@Output() adVisibility = new EventEmitter<'hidden' | 'partial' | 'full'>();

	@Input() showTopAd = false;

	showBottomTip = FeatureFlags.APP_TIPS;

	topAdSize = { width: 300, height: 250 };

	constructor(
		private ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
	}

	showSubscription() {
		amplitude.getInstance().logEvent('subscription-click', { page: 'banner' });
		this.ow.openStore();
	}

	showFeatures() {
		this.ow.openUrlInDefaultBrowser('https://github.com/Zero-to-Heroes/firestone/wiki/Premium-vs-ads');
	}

	onAdVisibilityChanged(visible: 'hidden' | 'partial' | 'full') {
		this.adVisibility.next(visible);
	}
}
