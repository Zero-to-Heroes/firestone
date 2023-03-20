import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
} from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TipService } from '../../services/tip.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

declare let amplitude: any;

@Component({
	selector: 'ads',
	styleUrls: [`../../../css/component/ads/ads.component.scss`],
	template: `
		<div class="ads">
			<div class="ad-container top-ads" *ngIf="showTopAd">
				<single-ad [adId]="'top'"></single-ad>
			</div>
			<div
				class="subscription-link"
				(click)="showSubscription()"
				[owTranslate]="'app.global.ads.support-the-dev'"
			></div>

			<div class="ad-container bottom-ads">
				<single-ad [adId]="'bottom'" [tip]="tip$ | async"></single-ad>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit, OnDestroy {
	tip$: Observable<string>;

	@Input() showTopAd = false;

	private tip = new BehaviorSubject<string>(null);
	private tipInterval;

	constructor(
		private ow: OverwolfService,
		private readonly tipService: TipService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.tip$ = this.tip.asObservable().pipe(this.mapData((tip) => tip));
		this.tipInterval = setInterval(() => {
			this.tip.next(this.tipService.getRandomTip());
		}, 10_000);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		super.ngOnDestroy();
		console.log('[ads] removing event listeners');
		if (this.tipInterval) {
			clearInterval(this.tipInterval);
		}
	}

	showSubscription() {
		amplitude.getInstance().logEvent('subscription-click', { page: 'banner' });
		this.ow.openStore();
	}
}
