import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	AppInjector,
	IAdsService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { premiumPlanIds, SubscriptionService } from './subscription/subscription.service';

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

	public async goToPremium() {
		return;
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
}
