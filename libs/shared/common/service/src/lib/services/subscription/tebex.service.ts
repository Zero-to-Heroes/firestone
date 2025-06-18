import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	EXTENSION_ID,
	OverwolfService,
	UserService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { CurrentPlan, PremiumPlanId } from './subscription.service';

// const STORE_ID = 1564884;
const STORE_PUBLIC_TOKEN = 'xjh0-5ef1e6461f2aa381db4df635c3c0c5556aed5191';
const TEBEX_PACKAGES_URL = `https://subscriptions-api.overwolf.com/packages/${STORE_PUBLIC_TOKEN}?extensionId=${EXTENSION_ID}`;
const TEBEX_SUBSCRIPTIONS_URL = `https://subscriptions-api.overwolf.com/subscriptions/${STORE_PUBLIC_TOKEN}?extensionId=${EXTENSION_ID}`;
const TEBEX_SUB_DETAILS_URL = `https://x3dealpmov6br4o7vmtiy5peyq0wzbms.lambda-url.us-west-2.on.aws`;

@Injectable({ providedIn: 'root' })
@Injectable()
export class TebexService extends AbstractFacadeService<TebexService> {
	public packages$$: SubscriberAwareBehaviorSubject<readonly TebexPackage[] | null>;

	private api: ApiRunner;
	private ow: OverwolfService;
	private user: UserService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'TebexService', () => !!this.packages$$);
	}

	protected override assignSubjects() {
		this.packages$$ = this.mainInstance.packages$$;
	}

	protected async init() {
		this.packages$$ = new SubscriberAwareBehaviorSubject<readonly TebexPackage[] | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.ow = AppInjector.get(OverwolfService);
		this.user = AppInjector.get(UserService);

		this.packages$$.onFirstSubscribe(async () => {
			console.log('[ads] [tebex] will load packages');
			const result: readonly TebexPackage[] | null = await this.api.callGetApi(TEBEX_PACKAGES_URL);
			console.log('[ads] [tebex] loaded packages');
			console.debug('[ads] [tebex] loaded packages', result);
			this.packages$$.next(result);
		});
	}

	public async subscribe(planId: string) {
		const allPackages = await this.packages$$.getValueWithInit();
		const currentUser = await this.user.getCurrentUser();
		if (!currentUser?.username) {
			return;
		}
		const userUuid = currentUser.uuid;
		const packageForPlan = allPackages?.find((p) => p.name.toLowerCase() === planId);
		if (!packageForPlan) {
			console.error('[ads] [tebex] could not find package for plan', planId, allPackages);
			return;
		}
		const url = `https://subscriptions-api.overwolf.com/checkout/${STORE_PUBLIC_TOKEN}/${packageForPlan.id}?extensionId=${EXTENSION_ID}&userId=${userUuid}`;
		console.log('[ads] [tebex] opening url', url);
		this.ow.openUrlInDefaultBrowser(url);
	}

	public async unsubscribe(planId: string) {
		this.ow.openUrlInDefaultBrowser(`https://checkout.tebex.io/payment-history/recurring-payments`);
	}

	public async getSubscriptionStatus(): Promise<CurrentPlan | null> {
		return this.mainInstance.getSubscriptionStatusInternal();
	}

	private async getSubscriptionStatusInternal(): Promise<CurrentPlan | null> {
		const currentUser = await this.user.getCurrentUser();
		if (!currentUser?.username) {
			return null;
		}

		const owToken = await this.ow.generateSessionToken();
		const tebexPlans = await this.api.callGetApi<readonly TebexSub[]>(TEBEX_SUBSCRIPTIONS_URL, {
			bearerToken: owToken,
		});
		console.log('[ads] [tebex] tebexPlans', tebexPlans, owToken);
		if (!tebexPlans?.length) {
			return null;
		}

		const tebexPlan = tebexPlans[0];
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

export interface TebexPackage {
	base_price: number;
	category: {
		id: number;
		name: string;
	};
	created_at: string;
	description: string;
	disable_gifting: boolean;
	disable_quantity: boolean;
	discount: number;
	expiration_date?: string;
	id: number;
	image?: string;
	name: string;
	sales_tax: number;
	total_price: number;
	type: 'subscription' | 'single';
	updated_at: string;
}

interface TebexSub {
	userId: string;
	packageId: number;
	recurringPaymentId: string;
	state: 'ACTIVE' | 'PENDING_CANCELLATION' | 'EXPIRED' | 'CANCELLED';
}

interface TebexSubDetails {
	expiryDate: string;
}
