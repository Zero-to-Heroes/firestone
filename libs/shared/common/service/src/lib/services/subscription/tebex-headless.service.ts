import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	CurrentPlan,
	PremiumPlanId,
	UserService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { TEBEX_PACKAGES_URL, TebexPackage, TebexSub } from './tebex.service';

const TEBEX_HEADLESS_SUBSCRIPTIONS_URL = 'https://mv7pyt4yrdeg2o26i6j5lljc2e0hnqti.lambda-url.us-west-2.on.aws/';

@Injectable({ providedIn: 'root' })
export class TebexHeadlessService extends AbstractFacadeService<TebexHeadlessService> {
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
		const currentUser = await this.user.getCurrentUser();
		console.log('[ads] [tebex-headless] current user', JSON.stringify(currentUser));
		// Only work with logged in users
		if (!currentUser?.username) {
			return null;
		}

		// console.log(
		// 	'[ads] [tebex-headless] calling tebex headless subscriptions url',
		// 	TEBEX_HEADLESS_SUBSCRIPTIONS_URL,
		// );
		const tebexPlans: readonly TebexSub[] = await this.api.callGetApi<readonly TebexSub[]>(
			TEBEX_HEADLESS_SUBSCRIPTIONS_URL,
			{
				bearerToken: currentUser.userId,
			},
		);
		console.log('[ads] [tebex-headless] tebexPlans', tebexPlans, currentUser.username, currentUser.userId);
		if (!tebexPlans?.length) {
			return null;
		}

		const tebexPlan = tebexPlans[0];
		console.log('[ads] [tebex-headless] tebexPlan retrieved', tebexPlan);

		const packages = await this.packages$$.getValueWithInit();
		const tebexPackage = packages?.find((p) => p.id === tebexPlan.packageId);
		console.debug('[ads] [tebex] tebexPackage', tebexPackage);
		if (!tebexPackage) {
			console.warn('[ads] [tebex] could not find package for sub', packages, tebexPlans);
			return null;
		}

		const subDetails: any = null;
		// await this.api.callGetApi<TebexSubDetails>(`${TEBEX_SUB_DETAILS_URL}/${tebexPackage.id}`, {
		// 	bearerToken: owToken,
		// });
		console.debug('[ads] [tebex] sub details', subDetails);
		const expiryDate = subDetails?.expiryDate;
		const result = {
			id: tebexPackage.name.toLowerCase() as PremiumPlanId,
			expireAt: expiryDate ? new Date(expiryDate) : null,
			active: tebexPlan.state !== 'EXPIRED' && tebexPlan.state !== 'CANCELLED',
			autoRenews: tebexPlan.state === 'ACTIVE',
			cancelled: tebexPlan.state === 'PENDING_CANCELLATION',
			discordCode: tebexPlans[0].recurringPaymentId,
		};
		console.debug('[ads] [tebex] current plan', result);
		return result;
	}
}
