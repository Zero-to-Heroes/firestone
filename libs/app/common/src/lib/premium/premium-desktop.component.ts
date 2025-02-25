/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, ViewRef } from '@angular/core';
import {
	CurrentPlan,
	OwLegacyPremiumService,
	PremiumPlanId,
	SubscriptionService,
	TebexService,
} from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	AnalyticsService,
	IAdsService,
	ILocalizationService,
} from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	distinctUntilChanged,
	filter,
	shareReplay,
	takeUntil,
	tap,
} from 'rxjs';

@Component({
	selector: 'premium-desktop',
	styleUrls: [`./premium-desktop.component.scss`],
	template: `
		<div class="premium">
			<div class="header">
				<div class="title" [fsTranslate]="'app.premium.title'"></div>
			</div>
			<!-- <div class="subtitle" [fsTranslate]="'app.premium.subtitle'"></div> -->
			<div class="plans-container">
				<!-- <div class="annual-toggle" *ngIf="billingPeriodicity$ | async as billing">
					<div
						class="element monthly"
						[ngClass]="{ selected: billing === 'monthly' }"
						(click)="changePeriodicity('monthly')"
					>
						<div class="text" [fsTranslate]="'app.premium.billing.monthly'"></div>
					</div>
					<div
						class="element yearly"
						[ngClass]="{ selected: billing === 'yearly' }"
						(click)="changePeriodicity('yearly')"
					>
						<div class="text" [fsTranslate]="'app.premium.billing.yearly'"></div>
						<div class="sub-text" [fsTranslate]="'app.premium.billing.yearly-subtext'"></div>
					</div>
				</div> -->
				<div class="plans" [ngClass]="{ 'show-legacy': showLegacyPlan$ | async }">
					<premium-package
						class="plan"
						*ngFor="let plan of plans$ | async"
						[plan]="plan"
						(subscribe)="onSubscribeRequest($event)"
						(unsubscribe)="onUnsubscribeRequest($event)"
					></premium-package>
				</div>
			</div>
		</div>
		<div class="modal-container confirmation-modal" *ngIf="showConfirmationPopUp$ | async as model">
			<div class="modal">
				<div class="background-container">
					<div class="title">{{ model.title }}</div>
					<div class="text">{{ model.text }}</div>
					<div class="buttons">
						<button
							class="button unsubscribe-button"
							*ngIf="!model.unsubscribing"
							[fsTranslate]="'app.premium.unsubscribe-button'"
							(click)="onUnsubscribe(model.planId)"
						></button>
						<button
							class="button unsubscribe-button processing"
							*ngIf="model.unsubscribing"
							[fsTranslate]="'app.premium.unsubscribe-modal.unsubscribe-ongoing-label'"
						></button>
						<button
							class="button cancel-button"
							[fsTranslate]="'app.premium.unsubscribe-modal.cancel-button'"
							(click)="onCancelUnsubscribe()"
						></button>
					</div>
				</div>
			</div>
		</div>
		<div class="modal-container pre-subscribe-modal" *ngIf="showPreSubscribeModal$ | async as model">
			<div class="modal">
				<div class="background-container">
					<div class="title">{{ model.title }}</div>
					<div class="text">{{ model.text }}</div>
					<div class="buttons">
						<button
							class="button cancel-button"
							[fsTranslate]="'app.premium.presubscribe-modal.cancel-button'"
							(click)="onCancelSubscribe()"
						></button>
						<button
							class="button subscribe-button"
							[fsTranslate]="'app.premium.presubscribe-modal.subscribe-button'"
							(click)="onSubscribe(model.planId)"
						></button>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PremiumDesktopComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	plans$: Observable<readonly PremiumPlan[]>;
	showLegacyPlan$: Observable<boolean>;
	showConfirmationPopUp$: Observable<UnsubscribeModel | null>;
	showPreSubscribeModal$: Observable<PresubscribeModel | null>;
	billingPeriodicity$: Observable<'monthly' | 'yearly'>;

	private showConfirmationPopUp$$ = new BehaviorSubject<UnsubscribeModel | null>(null);
	private showPreSubscribeModal$$ = new BehaviorSubject<PresubscribeModel | null>(null);
	private billingPeriodicity$$ = new BehaviorSubject<'monthly' | 'yearly'>('monthly');

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly subscriptionService: SubscriptionService,
		private readonly tebex: TebexService,
		private readonly owLegacyPremium: OwLegacyPremiumService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly i18n: ILocalizationService,
		private readonly analytics: AnalyticsService,
	) {
		super(cdr);
	}

	async ngAfterViewInit() {
		await this.tebex.isReady();
		await this.owLegacyPremium.isReady();
		await this.ads.isReady();
		await this.subscriptionService.isReady();

		this.showConfirmationPopUp$ = this.showConfirmationPopUp$$.asObservable();
		this.showPreSubscribeModal$ = this.showPreSubscribeModal$$.asObservable();
		this.billingPeriodicity$ = this.billingPeriodicity$$.asObservable();
		this.plans$ = combineLatest([
			this.tebex.packages$$,
			this.billingPeriodicity$$,
			this.subscriptionService.currentPlan$$,
		]).pipe(
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			filter(([allPackages, billingPeriodicity, currentPlanSub]) => !!allPackages?.length),
			this.mapData(([allPackages, billingPeriodicity, currentPlanSub]) => {
				const plans = billingPeriodicity === 'monthly' ? ALL_PLANS : ALL_PLANS_YEARLY;
				const packages =
					billingPeriodicity === 'yearly'
						? allPackages!.filter((p) => p.name.includes('annual'))
						: allPackages!.filter((p) => !p.name.includes('annual'));
				console.debug('building plans', plans, packages, billingPeriodicity, currentPlanSub);
				return (
					plans
						// .filter((plan) => currentPlanSub?.id === 'legacy' || plan.id !== 'legacy')
						.map((plan) => {
							const packageForPlan = packages?.find((p) => p.name.toLowerCase().includes(plan.id!));
							const rawPrice = packageForPlan?.total_price ?? plan.price;
							const price =
								rawPrice == null
									? '-'
									: billingPeriodicity === 'yearly'
									? (rawPrice / 12).toFixed(2)
									: rawPrice;
							const result: PremiumPlan = {
								...plan,
								price: price,
								activePlan: currentPlanSub,
								periodicity: billingPeriodicity,
							} as PremiumPlan;
							return result;
						})
				);
			}),
			tap((plans) => console.debug('built plans', plans)),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.showLegacyPlan$ = this.plans$.pipe(this.mapData((plans) => plans.some((plan) => plan.id === 'legacy')));
		this.plans$.subscribe((plans) => {
			this.showPreSubscribeModal$$.next(null);
			this.showConfirmationPopUp$$.next(null);
		});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onUnsubscribeRequest(planId: string) {
		this.analytics.trackEvent('premium', { type: 'unsubscribe-request', planId: planId });
		const model: UnsubscribeModel = {
			planId: planId,
			title: this.i18n.translateString('app.premium.unsubscribe-modal.title', {
				plan: this.i18n.translateString(`app.premium.plan.${planId}`),
			}),
			text:
				planId === 'legacy'
					? this.i18n.translateString('app.premium.unsubscribe-modal.text-legacy')
					: this.i18n.translateString('app.premium.unsubscribe-modal.text'),
		};
		this.showConfirmationPopUp$$.next(model);
	}

	async onUnsubscribe(planId: string) {
		this.analytics.trackEvent('premium', { type: 'unsubscribe', planId: planId });
		const newModel: UnsubscribeModel = {
			...this.showConfirmationPopUp$$.getValue()!,
			unsubscribing: true,
		};
		this.showConfirmationPopUp$$.next(newModel);
		console.log('unsubscribing from plan', planId);
		const result = await this.subscriptionService.unsubscribe(planId);
		console.log('unsubscribed from plan result', planId, result);
		this.showConfirmationPopUp$$.next(null);
	}

	onCancelUnsubscribe() {
		this.showConfirmationPopUp$$.next(null);
	}

	onSubscribeRequest(planId: string) {
		this.analytics.trackEvent('premium', { type: 'subscribe-request', planId: planId });
		const model: PresubscribeModel = {
			planId: planId,
			title: this.i18n.translateString('app.premium.presubscribe-modal.title', {
				plan: this.i18n.translateString(`app.premium.plan.${planId}`),
			}),
			text:
				planId === 'legacy'
					? this.i18n.translateString('app.premium.presubscribe-modal.text-legacy')
					: this.i18n.translateString('app.premium.presubscribe-modal.text'),
		};
		this.showPreSubscribeModal$$.next(model);
	}

	async onSubscribe(planId: string) {
		this.analytics.trackEvent('premium', { type: 'subscribe', planId: planId });
		const result = await this.subscriptionService.subscribe(planId);
	}

	onCancelSubscribe() {
		this.showPreSubscribeModal$$.next(null);
	}

	changePeriodicity(periodicity: 'monthly' | 'yearly') {
		this.billingPeriodicity$$.next(periodicity);
	}
}

const ALL_PLANS: readonly Partial<PremiumPlan>[] = [
	// {
	// 	id: 'friend',
	// 	features: {
	// 		supportFirestone: true,
	// 		discordRole: 'friend',
	// 	},
	// },
	{
		id: 'premium',
		features: {
			supportFirestone: true,
			discordRole: 'premium',
			removeAds: true,
			premiumFeatures: true,
		},
	},
	// {
	// 	id: 'epic',
	// 	features: {
	// 		supportFirestone: true,
	// 		discordRole: 'epic',
	// 		removeAds: true,
	// 		premiumFeatures: true,
	// 		prioritySupport: true,
	// 	},
	// },
	{
		id: 'legacy',
		features: {
			supportFirestone: true,
			removeAds: true,
			premiumFeatures: true,
		},
		// isReadonly: true,
		price: 4.99,
		text: `app.premium.legacy-plan-text`,
	},
];
const ALL_PLANS_YEARLY: readonly Partial<PremiumPlan>[] = [
	// {
	// 	id: 'friend',
	// 	features: {
	// 		supportFirestone: true,
	// 		discordRole: 'friend',
	// 		yearlyDiscount: true,
	// 	},
	// },
	{
		id: 'premium',
		features: {
			supportFirestone: true,
			discordRole: 'premium',
			removeAds: true,
			premiumFeatures: true,
			yearlyDiscount: true,
		},
	},
	// {
	// 	id: 'epic',
	// 	features: {
	// 		supportFirestone: true,
	// 		discordRole: 'epic',
	// 		removeAds: true,
	// 		premiumFeatures: true,
	// 		prioritySupport: true,
	// 		yearlyDiscount: true,
	// 	},
	// },
];

export interface PremiumPlan {
	readonly id: PremiumPlanId;
	readonly price: number;
	readonly periodicity: 'monthly' | 'yearly';
	readonly features: {
		readonly supportFirestone?: boolean;
		readonly discordRole?: string;
		readonly removeAds?: boolean;
		readonly premiumFeatures?: boolean;
		readonly prioritySupport?: boolean;
		readonly yearlyDiscount?: boolean;
	};
	readonly isReadonly?: boolean;
	readonly activePlan?: CurrentPlan;
	readonly text?: string;
}

interface UnsubscribeModel {
	readonly planId: string;
	readonly title: string;
	readonly text: string;
	readonly subscribing?: boolean;
	readonly unsubscribing?: boolean;
}
interface PresubscribeModel {
	readonly planId: string;
	readonly title: string;
	readonly text: string;
}
