import { Injectable } from '@angular/core';
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
import { isActivePremiumPlan, SubscriptionService } from './subscription/subscription.service';

@Injectable({ providedIn: 'root' })
export class StandaloneAdService extends AbstractFacadeService<StandaloneAdService> implements IAdsService {
	public hasPremiumSub$$: BehaviorSubject<boolean>;
	public enablePremiumFeatures$$: BehaviorSubject<boolean>;

	private subscriptions: SubscriptionService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'StandaloneAdService', () => !!this.hasPremiumSub$$);
	}

	protected override assignSubjects() {
		this.enablePremiumFeatures$$ = this.mainInstance.enablePremiumFeatures$$;
		this.hasPremiumSub$$ = this.mainInstance.hasPremiumSub$$;
	}

	protected async init() {
		this.enablePremiumFeatures$$ = new BehaviorSubject<boolean>(false);
		this.hasPremiumSub$$ = new BehaviorSubject<boolean>(false);
		this.subscriptions = AppInjector.get(SubscriptionService);

		// await waitForReady(this.subscriptions, this.lottery);
		await waitForReady(this.subscriptions);

		this.subscriptions.currentPlan$$.subscribe((plan) => {
			console.log('[ads] current plan', plan);
			const hasPremiumSub = isActivePremiumPlan(plan);
			this.hasPremiumSub$$.next(hasPremiumSub);
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
		this.setupElectronSubject(this.enablePremiumFeatures$$, 'enablePremiumFeatures');
		this.setupElectronSubject(this.hasPremiumSub$$, 'hasPremiumSub');
	}

	protected override createElectronProxy(ipcRenderer: any) {
		console.debug('[electron-ad] createElectronProxy');
		this.enablePremiumFeatures$$ = new BehaviorSubject<boolean>(false);
		this.hasPremiumSub$$ = new BehaviorSubject<boolean>(false);
	}

	protected override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod('shouldDisplayAdsInternal', () => this.shouldDisplayAdsInternal());
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
		return;
	}

	public async shouldDisplayAds(): Promise<boolean> {
		return this.callOnMainProcess<boolean>('shouldDisplayAdsInternal');
	}
	public async shouldDisplayAdsInternal(): Promise<boolean> {
		const plan = await this.subscriptions.currentPlan$$.getValueWithInit(undefined);
		return !isActivePremiumPlan(plan);
	}
}
