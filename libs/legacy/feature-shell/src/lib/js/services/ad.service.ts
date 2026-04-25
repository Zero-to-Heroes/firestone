import { Injectable } from '@angular/core';
import { isPreReleaseBuild } from '@firestone/game-state';
import { LotteryWidgetControllerService } from '@firestone/lottery/common';
import { AppNavigationService, premiumPlanIds, SubscriptionService } from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	AppInjector,
	IAdsService,
	isElectronContext,
	isMainProcess,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged } from 'rxjs';

@Injectable()
export class AdService extends AbstractFacadeService<AdService> implements IAdsService {
	public hasPremiumSub$$: BehaviorSubject<boolean>;
	public enablePremiumFeatures$$: BehaviorSubject<boolean>;

	private subscriptions: SubscriptionService;
	private appNavigation: AppNavigationService;
	private lottery: LotteryWidgetControllerService;

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
		this.subscriptions = AppInjector.get(SubscriptionService);
		this.appNavigation = AppInjector.get(AppNavigationService);
		this.lottery = AppInjector.get(LotteryWidgetControllerService);
		this.addDevMode();

		await waitForReady(this.subscriptions, this.lottery);

		this.subscriptions.currentPlan$$.subscribe((plan) => {
			if (isPreReleaseBuild) {
				this.hasPremiumSub$$.next(true);
				return;
			}
			console.log('[ads] current plan', plan);
			const hasPremiumSub = premiumPlanIds.includes(plan?.id);
			this.hasPremiumSub$$.next(hasPremiumSub);
		});
		combineLatest([this.hasPremiumSub$$, this.lottery.shouldTrack$$]).subscribe(([isPremium, shouldTrack]) => {
			console.debug('[ads] isPremium', isPremium, 'show ads?', shouldTrack);
			this.enablePremiumFeatures$$.next(isPremium || shouldTrack);
		});
		this.hasPremiumSub$$.pipe(distinctUntilChanged()).subscribe((hasPremiumSub) => {
			console.debug('[ads] hasPremiumSub?', hasPremiumSub);
		});
		if (isPreReleaseBuild) {
			this.hasPremiumSub$$.next(true);
			return;
		}
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('goToPremiumInternal', () => this.goToPremiumInternal());
		this.registerMainProcessMethod('shouldDisplayAdsInternal', () => this.shouldDisplayAdsInternal());
	}

	public applyAuthPremiumHint(isPremium: boolean): void {
		if (!isPremium) {
			return;
		}
		if (isElectronContext() && !isMainProcess()) {
			return;
		}
		this.hasPremiumSub$$.next(true);
	}

	public async goToPremium(): Promise<void> {
		await this.callOnMainProcess<void>('goToPremiumInternal');
	}

	private async goToPremiumInternal() {
		this.appNavigation.goToPremium();
	}

	public async shouldDisplayAds(): Promise<boolean> {
		return this.callOnMainProcess<boolean>('shouldDisplayAdsInternal');
	}

	public async shouldDisplayAdsInternal(): Promise<boolean> {
		const plan = await this.subscriptions.currentPlan$$.getValueWithInit(undefined);
		if (premiumPlanIds.includes(plan?.id)) {
			return false;
		}
		return true;
	}

	private addDevMode() {
		if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') {
			return;
		}
		window['toggleAds'] = () => {
			this.hasPremiumSub$$.next(!this.hasPremiumSub$$.value);
			this.enablePremiumFeatures$$.next(this.hasPremiumSub$$.value);
			console.debug('[ads] toggled ads', !this.hasPremiumSub$$.value);
		};
	}
}
