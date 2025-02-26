import { Injectable } from '@angular/core';
import { AppNavigationService, premiumPlanIds, SubscriptionService } from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	AppInjector,
	IAdsService,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged } from 'rxjs';
import { AppUiStoreFacadeService } from './ui-store/app-ui-store-facade.service';

@Injectable()
export class AdService extends AbstractFacadeService<AdService> implements IAdsService {
	public hasPremiumSub$$: BehaviorSubject<boolean>;
	public enablePremiumFeatures$$: BehaviorSubject<boolean>;

	private store: AppUiStoreFacadeService;
	private subscriptions: SubscriptionService;
	private appNavigation: AppNavigationService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'adsService', () => !!this.hasPremiumSub$$);
	}

	protected override assignSubjects() {
		this.enablePremiumFeatures$$ = this.mainInstance.enablePremiumFeatures$$;
		this.hasPremiumSub$$ = this.mainInstance.hasPremiumSub$$;
	}

	protected async init() {
		this.enablePremiumFeatures$$ = new BehaviorSubject<boolean>(false);
		this.hasPremiumSub$$ = new BehaviorSubject<boolean>(false);
		this.store = AppInjector.get(AppUiStoreFacadeService);
		this.subscriptions = AppInjector.get(SubscriptionService);
		this.appNavigation = AppInjector.get(AppNavigationService);
		this.addDevMode();

		await waitForReady(this.subscriptions);
		await this.store.initComplete();

		this.subscriptions.currentPlan$$.subscribe((plan) => {
			console.log('[ads] current plan', plan);
			const hasPremiumSub = premiumPlanIds.includes(plan?.id);
			this.hasPremiumSub$$.next(hasPremiumSub);
		});
		combineLatest([this.hasPremiumSub$$, this.store.shouldTrackLottery$()]).subscribe(
			([isPremium, shouldTrack]) => {
				console.debug('[ads] isPremium', isPremium, 'show ads?', shouldTrack);
				this.enablePremiumFeatures$$.next(isPremium || shouldTrack);
			},
		);
		this.hasPremiumSub$$.pipe(distinctUntilChanged()).subscribe((hasPremiumSub) => {
			console.debug('[ads] hasPremiumSub?', hasPremiumSub);
		});
	}

	public async goToPremium() {
		return this.mainInstance.goToPremiumInternal();
	}

	private async goToPremiumInternal() {
		this.appNavigation.goToPremium();
	}

	public async shouldDisplayAds(): Promise<boolean> {
		return this.mainInstance.shouldDisplayAdsInternal();
	}

	public async shouldDisplayAdsInternal(): Promise<boolean> {
		const plan = await this.subscriptions.currentPlan$$.getValueWithInit(undefined);
		if (premiumPlanIds.includes(plan?.id)) {
			return false;
		}
		return true;
	}

	private addDevMode() {
		if (process.env.NODE_ENV === 'production') {
			return;
		}
		window['toggleAds'] = () => {
			this.hasPremiumSub$$.next(!this.hasPremiumSub$$.value);
			this.enablePremiumFeatures$$.next(this.hasPremiumSub$$.value);
			console.debug('[ads] toggled ads', !this.hasPremiumSub$$.value);
		};
	}
}
