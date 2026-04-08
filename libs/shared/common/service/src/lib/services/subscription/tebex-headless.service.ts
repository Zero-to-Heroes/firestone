import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	UserService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { CurrentPlan } from './subscription.service';
import { TEBEX_PACKAGES_URL, TebexPackage, TebexService, TebexSub } from './tebex.service';

const TEBEX_HEADLESS_SUBSCRIPTIONS_URL = 'https://mv7pyt4yrdeg2o26i6j5lljc2e0hnqti.lambda-url.us-west-2.on.aws/';

@Injectable({ providedIn: 'root' })
export class TebexHeadlessService extends AbstractFacadeService<TebexService> {
	public packages$$: SubscriberAwareBehaviorSubject<readonly TebexPackage[] | null>;

	protected api: ApiRunner;
	protected user: UserService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'TebexHeadlessService', () => !!this.packages$$);
	}

	protected override assignSubjects() {
		this.packages$$ = this.mainInstance.packages$$;
	}

	protected async init() {
		this.packages$$ = new SubscriberAwareBehaviorSubject<readonly TebexPackage[] | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.user = AppInjector.get(UserService);

		this.packages$$.onFirstSubscribe(async () => {
			console.log('[ads] [tebex] will load packages');
			const result: readonly TebexPackage[] | null = await this.api.callGetApi(TEBEX_PACKAGES_URL);
			console.log('[ads] [tebex] loaded packages');
			console.debug('[ads] [tebex] loaded packages', result);
			this.packages$$.next(result);
		});
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('getSubscriptionStatusInternal', () => this.getSubscriptionStatusInternal());
	}

	protected override initElectronSubjects(): void {
		this.setupElectronSubject(this.packages$$, 'TebexService-packages');
	}

	protected override async createElectronProxy(ipcRenderer: any) {
		this.packages$$ = new SubscriberAwareBehaviorSubject<readonly TebexPackage[] | null>(null);
	}

	public async subscribe(planId: string) {
		console.error('[ads] [tebex-headless] subscribe not implemented');
	}

	public async unsubscribe(planId: string) {
		console.error('[ads] [tebex-headless] unsubscribe not implemented');
	}

	public async getSubscriptionStatus(): Promise<CurrentPlan | null> {
		return this.callOnMainProcess<CurrentPlan | null>('getSubscriptionStatusInternal');
	}
	protected async getSubscriptionStatusInternal(): Promise<CurrentPlan | null> {
		console.log('[ads] [tebex-headless] getting subscription status internal');
		const currentUser = await this.user.getCurrentUser();
		console.log('[ads] [tebex-headless] current user', currentUser);
		if (!currentUser?.username) {
			return null;
		}

		console.log('[ads] [tebex-headless] calling tebex headless subscriptions url');
		const tebexPlans = await this.api.callGetApi<readonly TebexSub[]>(TEBEX_HEADLESS_SUBSCRIPTIONS_URL, {
			bearerToken: currentUser.username,
		});
		console.log('[ads] [tebex-headless] tebexPlans', tebexPlans, currentUser.username);
		if (!tebexPlans?.length) {
			return null;
		}

		return null;
	}
}
