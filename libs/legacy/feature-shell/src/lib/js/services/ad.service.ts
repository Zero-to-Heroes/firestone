import { Injectable } from '@angular/core';
import { isPreReleaseBuild } from '@firestone/game-state';
import { LotteryWidgetControllerService } from '@firestone/lottery/common';
import { AppNavigationService, SubscriptionService } from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	AppInjector,
	CurrentPlan,
	IAdsService,
	isElectronContext,
	isMainProcess,
	premiumPlanIds,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged } from 'rxjs';

// Anti-tamper speed bump: how often we re-derive the premium gates from server truth (currentPlan /
// bypass latch), so a direct .next(true) on the public subjects (the crack's move) is reverted.
const REASSERT_INTERVAL = 5 * 1000;

@Injectable()
export class AdService extends AbstractFacadeService<AdService> implements IAdsService {
	public hasPremiumSub$$: BehaviorSubject<boolean>;
	public enablePremiumFeatures$$: BehaviorSubject<boolean>;
	public currentPlan$$: BehaviorSubject<CurrentPlan | null>;
	public bypassDetected$$: BehaviorSubject<boolean>;

	private subscriptions: SubscriptionService;
	private appNavigation: AppNavigationService;
	private lottery: LotteryWidgetControllerService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'adsService', () => !!this.hasPremiumSub$$);
	}

	protected override assignSubjects() {
		this.enablePremiumFeatures$$ = this.mainInstance.enablePremiumFeatures$$;
		this.hasPremiumSub$$ = this.mainInstance.hasPremiumSub$$;
		this.currentPlan$$ = this.mainInstance.currentPlan$$;
		this.bypassDetected$$ = this.mainInstance.bypassDetected$$;
	}

	protected async init() {
		this.enablePremiumFeatures$$ = new BehaviorSubject<boolean>(false);
		this.hasPremiumSub$$ = new BehaviorSubject<boolean>(false);
		this.currentPlan$$ = new BehaviorSubject<CurrentPlan | null>(null);
		this.bypassDetected$$ = new BehaviorSubject<boolean>(false);
		this.subscriptions = AppInjector.get(SubscriptionService);
		this.appNavigation = AppInjector.get(AppNavigationService);
		this.lottery = AppInjector.get(LotteryWidgetControllerService);
		this.addDevMode();

		await waitForReady(this.subscriptions, this.lottery);

		combineLatest([this.subscriptions.currentPlan$$, this.bypassDetected$$]).subscribe(([plan, bypassDetected]) => {
			this.currentPlan$$.next(plan);
			this.hasPremiumSub$$.next(this.computeHasPremiumSub(plan, bypassDetected));
		});
		combineLatest([this.hasPremiumSub$$, this.lottery.shouldTrack$$, this.bypassDetected$$]).subscribe(
			([isPremium, shouldTrack, bypassDetected]) => {
				console.debug('[ads] isPremium', isPremium, 'show ads?', shouldTrack);
				this.enablePremiumFeatures$$.next(!bypassDetected && (isPremium || shouldTrack));
			},
		);
		this.hasPremiumSub$$.pipe(distinctUntilChanged()).subscribe((hasPremiumSub) => {
			console.debug('[ads] hasPremiumSub?', hasPremiumSub);
		});
		this.startTamperResistance();
	}

	// Server truth (currentPlan) gated by the bypass latch. isPreReleaseBuild forces premium for
	// internal builds, but is ignored once a bypass is confirmed.
	private computeHasPremiumSub(plan: CurrentPlan | null, bypassDetected: boolean): boolean {
		if (bypassDetected) {
			return false;
		}
		if (isPreReleaseBuild) {
			return true;
		}
		return premiumPlanIds.includes(plan?.id);
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.currentPlan$$, 'AdService-currentPlan');
		this.setupElectronSubject(this.enablePremiumFeatures$$, 'AdService-enablePremiumFeatures');
		this.setupElectronSubject(this.hasPremiumSub$$, 'AdService-hasPremiumSub');
		this.setupElectronSubject(this.bypassDetected$$, 'AdService-bypassDetected');
	}

	protected override async createElectronProxy(ipcRenderer: any) {
		this.currentPlan$$ = new BehaviorSubject<CurrentPlan | null>(null);
		this.enablePremiumFeatures$$ = new BehaviorSubject<boolean>(false);
		this.hasPremiumSub$$ = new BehaviorSubject<boolean>(false);
		this.bypassDetected$$ = new BehaviorSubject<boolean>(false);
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('goToPremiumInternal', () => this.goToPremiumInternal());
		this.registerMainProcessMethod('shouldDisplayAdsInternal', () => this.shouldDisplayAdsInternal());
		this.registerMainProcessMethod('unsubscribeInternal', (planId: string) => this.unsubscribeInternal(planId));
		this.registerMainProcessMethod('subscribeInternal', (planId: string) => this.subscribeInternal(planId));
		this.registerMainProcessMethod('forceNonPremiumInternal', (reason: string) =>
			this.forceNonPremiumInternal(reason),
		);
	}

	public subscribe(planId: string): void {
		this.callOnMainProcess<void>('subscribeInternal', planId);
	}
	private async subscribeInternal(planId: string): Promise<void> {
		this.subscriptions.subscribe(planId);
	}

	public unsubscribe(planId: string): void {
		this.callOnMainProcess<void>('unsubscribeInternal', planId);
	}
	private async unsubscribeInternal(planId: string): Promise<void> {
		this.subscriptions.unsubscribe(planId);
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

	public forceNonPremium(reason: string): void {
		// The subjects are owned by the main process (Electron) / main instance (Overwolf); route there.
		if (isElectronContext() && !isMainProcess()) {
			this.callOnMainProcess<void>('forceNonPremiumInternal', reason);
			return;
		}
		this.forceNonPremiumInternal(reason);
	}

	private async forceNonPremiumInternal(reason: string): Promise<void> {
		if (this.bypassDetected$$.value) {
			return;
		}
		console.warn('[ads] membership tamper confirmed, forcing non-premium', reason);
		this.bypassDetected$$.next(true);
		this.hasPremiumSub$$.next(false);
		this.enablePremiumFeatures$$.next(false);
	}

	// Anti-tamper speed bump (not a security boundary): periodically re-derive the gates from server
	// truth so a bare .next(true) on the public subjects - the CDP-injection crack's move - is reverted.
	private startTamperResistance(): void {
		setInterval(() => {
			const plan = this.currentPlan$$.value;
			const bypassDetected = this.bypassDetected$$.value;
			const expectedHasPremium = this.computeHasPremiumSub(plan, bypassDetected);
			if (this.hasPremiumSub$$.value !== expectedHasPremium) {
				this.hasPremiumSub$$.next(expectedHasPremium);
			}
			const expectedEnable = !bypassDetected && (expectedHasPremium || this.lottery.shouldTrack$$.value);
			if (this.enablePremiumFeatures$$.value !== expectedEnable) {
				this.enablePremiumFeatures$$.next(expectedEnable);
			}
		}, REASSERT_INTERVAL);
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
