import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	AppInjector,
	CurrentPlan,
	IAdsService,
	isActivePremiumPlan,
	isElectronContext,
	isMainProcess,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged } from 'rxjs';
import { AppNavigationService } from './app-navigation.service';
import { SubscriptionService } from './subscription/subscription.service';

@Injectable({ providedIn: 'root' })
export class StandaloneAdService extends AbstractFacadeService<StandaloneAdService> implements IAdsService {
	public hasPremiumSub$$: BehaviorSubject<boolean>;
	public enablePremiumFeatures$$: BehaviorSubject<boolean>;
	public currentPlan$$: BehaviorSubject<CurrentPlan | null>;

	private subscriptions: SubscriptionService;
	private appNavigation: AppNavigationService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'StandaloneAdService', () => !!this.hasPremiumSub$$);
	}

	protected override assignSubjects() {
		this.enablePremiumFeatures$$ = this.mainInstance.enablePremiumFeatures$$;
		this.hasPremiumSub$$ = this.mainInstance.hasPremiumSub$$;
		this.currentPlan$$ = this.mainInstance.currentPlan$$;
	}

	protected async init() {
		this.enablePremiumFeatures$$ = new BehaviorSubject<boolean>(false);
		this.hasPremiumSub$$ = new BehaviorSubject<boolean>(false);
		this.currentPlan$$ = new BehaviorSubject<CurrentPlan | null>(null);
		this.subscriptions = AppInjector.get(SubscriptionService);
		this.appNavigation = AppInjector.get(AppNavigationService);

		// await waitForReady(this.subscriptions, this.lottery);
		await waitForReady(this.subscriptions, this.appNavigation);

		this.subscriptions.currentPlan$$.subscribe((plan) => {
			console.log('[ads] current plan', plan);
			const hasPremiumSub = isActivePremiumPlan(plan);
			this.hasPremiumSub$$.next(hasPremiumSub);
			this.currentPlan$$.next(plan);
		});
		// combineLatest([this.hasPremiumSub$$, this.lottery.shouldTrack$$]).subscribe(([isPremium, shouldTrack]) => {
		combineLatest([this.hasPremiumSub$$]).subscribe(([isPremium]) => {
			console.debug('[ads] isPremium', isPremium, 'show ads?');
			this.enablePremiumFeatures$$.next(isPremium);
		});
		this.hasPremiumSub$$.pipe(distinctUntilChanged()).subscribe((hasPremiumSub) => {
			console.debug('[ads] hasPremiumSub?', hasPremiumSub);
		});
	}

	protected override initElectronSubjects() {
		console.debug('[electron-ad] initElectronSubjects');
		this.setupElectronSubject(this.enablePremiumFeatures$$, 'StandaloneAdService-enablePremiumFeatures');
		this.setupElectronSubject(this.hasPremiumSub$$, 'StandaloneAdService-hasPremiumSub');
		this.setupElectronSubject(this.currentPlan$$, 'StandaloneAdService-currentPlan');
	}

	protected override createElectronProxy(ipcRenderer: any) {
		console.debug('[electron-ad] createElectronProxy');
		this.enablePremiumFeatures$$ = new BehaviorSubject<boolean>(false);
		this.hasPremiumSub$$ = new BehaviorSubject<boolean>(false);
		this.currentPlan$$ = new BehaviorSubject<CurrentPlan | null>(null);
	}

	protected override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod('shouldDisplayAdsInternal', () => this.shouldDisplayAdsInternal());
		this.registerMainProcessMethod('goToPremiumInternal', () => this.goToPremiumInternal());
		this.registerMainProcessMethod('unsubscribeInternal', (planId: string) => this.unsubscribeInternal(planId));
		this.registerMainProcessMethod('subscribeInternal', (planId: string) => this.subscribeInternal(planId));
	}

	public subscribe(planId: string): void {
		this.callOnMainProcess<void>('subscribeInternal', planId);
	}
	public async subscribeInternal(planId: string): Promise<void> {
		this.subscriptions.subscribe(planId);
	}

	public unsubscribe(planId: string): void {
		this.callOnMainProcess<void>('unsubscribeInternal', planId);
	}
	public async unsubscribeInternal(planId: string): Promise<void> {
		this.subscriptions.unsubscribe(planId);
	}

	public applyAuthPremiumHint(isPremium: boolean): void {
		if (!isPremium) {
			return;
		}
		// Only the Electron main process owns the real subject; avoid touching renderer copies.
		if (isElectronContext() && !isMainProcess()) {
			return;
		}
		this.hasPremiumSub$$.next(true);
	}

	public async goToPremium() {
		return this.callOnMainProcess<void>('goToPremiumInternal');
	}
	public async goToPremiumInternal(): Promise<void> {
		this.appNavigation.goToPremium();
	}

	public async shouldDisplayAds(): Promise<boolean> {
		return this.callOnMainProcess<boolean>('shouldDisplayAdsInternal');
	}
	public async shouldDisplayAdsInternal(): Promise<boolean> {
		const plan = await this.subscriptions.currentPlan$$.getValueWithInit(undefined);
		return !isActivePremiumPlan(plan);
	}
}
