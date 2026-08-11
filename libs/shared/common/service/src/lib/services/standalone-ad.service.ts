import { Injectable, NgZone } from '@angular/core';
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

// Anti-tamper speed bump: how often we re-derive the premium gates from server truth (currentPlan /
// bypass latch), so a direct .next(true) on the public subjects (the crack's move) is reverted.
const REASSERT_INTERVAL = 5 * 1000;

@Injectable({ providedIn: 'root' })
export class StandaloneAdService extends AbstractFacadeService<StandaloneAdService> implements IAdsService {
	public hasPremiumSub$$: BehaviorSubject<boolean>;
	public enablePremiumFeatures$$: BehaviorSubject<boolean>;
	public currentPlan$$: BehaviorSubject<CurrentPlan | null>;
	public bypassDetected$$: BehaviorSubject<boolean>;

	private subscriptions: SubscriptionService;
	private appNavigation: AppNavigationService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'StandaloneAdService', () => !!this.hasPremiumSub$$);
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

		// await waitForReady(this.subscriptions, this.lottery);
		await waitForReady(this.subscriptions, this.appNavigation);

		combineLatest([this.subscriptions.currentPlan$$, this.bypassDetected$$]).subscribe(([plan, bypassDetected]) => {
			console.log('[ads] current plan', JSON.stringify(plan));
			this.currentPlan$$.next(plan);
			this.hasPremiumSub$$.next(this.computeHasPremiumSub(plan, bypassDetected));
		});
		combineLatest([this.hasPremiumSub$$, this.bypassDetected$$]).subscribe(([isPremium, bypassDetected]) => {
			console.debug('[ads] isPremium', isPremium, 'show ads?');
			this.enablePremiumFeatures$$.next(!bypassDetected && isPremium);
		});
		this.hasPremiumSub$$.pipe(distinctUntilChanged()).subscribe((hasPremiumSub) => {
			console.debug('[ads] hasPremiumSub?', hasPremiumSub);
		});
		this.startTamperResistance();
	}

	// Server truth (currentPlan) gated by the bypass latch.
	private computeHasPremiumSub(plan: CurrentPlan | null, bypassDetected: boolean): boolean {
		return !bypassDetected && isActivePremiumPlan(plan);
	}

	protected override initElectronSubjects() {
		console.debug('[electron-ad] initElectronSubjects');
		this.setupElectronSubject(this.enablePremiumFeatures$$, 'StandaloneAdService-enablePremiumFeatures');
		this.setupElectronSubject(this.hasPremiumSub$$, 'StandaloneAdService-hasPremiumSub');
		this.setupElectronSubject(this.currentPlan$$, 'StandaloneAdService-currentPlan');
		this.setupElectronSubject(this.bypassDetected$$, 'StandaloneAdService-bypassDetected');
	}

	protected override createElectronProxy(ipcRenderer: any) {
		console.debug('[electron-ad] createElectronProxy');
		this.enablePremiumFeatures$$ = new BehaviorSubject<boolean>(false);
		this.hasPremiumSub$$ = new BehaviorSubject<boolean>(false);
		this.currentPlan$$ = new BehaviorSubject<CurrentPlan | null>(null);
		this.bypassDetected$$ = new BehaviorSubject<boolean>(false);
	}

	protected override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod('shouldDisplayAdsInternal', () => this.shouldDisplayAdsInternal());
		this.registerMainProcessMethod('goToPremiumInternal', () => this.goToPremiumInternal());
		this.registerMainProcessMethod('unsubscribeInternal', (planId: string) => this.unsubscribeInternal(planId));
		this.registerMainProcessMethod('subscribeInternal', (planId: string) => this.subscribeInternal(planId));
		this.registerMainProcessMethod('forceNonPremiumInternal', (reason: string) =>
			this.forceNonPremiumInternal(reason),
		);
		this.registerMainProcessMethod('clearForceNonPremiumInternal', (reason: string) =>
			this.clearForceNonPremiumInternal(reason),
		);
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

	public forceNonPremium(reason: string): void {
		// The subjects are owned by the main process; route there.
		if (isElectronContext() && !isMainProcess()) {
			this.callOnMainProcess<void>('forceNonPremiumInternal', reason);
			return;
		}
		this.forceNonPremiumInternal(reason);
	}

	public clearForceNonPremium(reason: string): void {
		if (isElectronContext() && !isMainProcess()) {
			this.callOnMainProcess<void>('clearForceNonPremiumInternal', reason);
			return;
		}
		this.clearForceNonPremiumInternal(reason);
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

	private async clearForceNonPremiumInternal(reason: string): Promise<void> {
		if (!this.bypassDetected$$.value) {
			return;
		}
		console.warn('[ads] clearing force-non-premium latch', reason);
		this.bypassDetected$$.next(false);
		const plan = this.currentPlan$$.value;
		const hasPremium = this.computeHasPremiumSub(plan, false);
		this.hasPremiumSub$$.next(hasPremium);
		this.enablePremiumFeatures$$.next(hasPremium);
	}

	// Anti-tamper speed bump (not a security boundary): periodically re-derive the gates from server
	// truth so a bare .next(true) on the public subjects - the CDP-injection crack's move - is reverted.
	// The interval runs outside the Angular zone so the periodic no-op checks don't wake change
	// detection; we only re-enter the zone when a gate actually needs reverting.
	private startTamperResistance(): void {
		const ngZone = AppInjector?.get(NgZone, null);
		const reassertGates = () => {
			const plan = this.currentPlan$$.value;
			const bypassDetected = this.bypassDetected$$.value;
			const expectedHasPremium = this.computeHasPremiumSub(plan, bypassDetected);
			const expectedEnable = !bypassDetected && expectedHasPremium;
			if (
				this.hasPremiumSub$$.value === expectedHasPremium &&
				this.enablePremiumFeatures$$.value === expectedEnable
			) {
				return;
			}
			const apply = () => {
				if (this.hasPremiumSub$$.value !== expectedHasPremium) {
					this.hasPremiumSub$$.next(expectedHasPremium);
				}
				if (this.enablePremiumFeatures$$.value !== expectedEnable) {
					this.enablePremiumFeatures$$.next(expectedEnable);
				}
			};
			if (ngZone) {
				ngZone.run(apply);
			} else {
				apply();
			}
		};
		if (ngZone) {
			ngZone.runOutsideAngular(() => setInterval(reassertGates, REASSERT_INTERVAL));
		} else {
			setInterval(reassertGates, REASSERT_INTERVAL);
		}
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
