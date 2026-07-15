import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	EXTENSION_ID,
	EXTERNAL_URL_SERVICE_TOKEN,
	IExternalUrlService,
	OverwolfService,
	PremiumPlanId,
	UserService,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { PreferencesService } from '../preferences.service';
import { SUB_STATUS_ERROR, SubStatusResult } from './subscription-status';

// const STORE_ID = 1564884;
export const STORE_PUBLIC_TOKEN = 'xjh0-5ef1e6461f2aa381db4df635c3c0c5556aed5191';
export const TEBEX_PACKAGES_URL = `https://subscriptions-api.overwolf.com/packages/${STORE_PUBLIC_TOKEN}?extensionId=${EXTENSION_ID}`;
const TEBEX_SUBSCRIPTIONS_URL = `https://subscriptions-api.overwolf.com/subscriptions/${STORE_PUBLIC_TOKEN}?extensionId=${EXTENSION_ID}`;
const TEBEX_SUB_DETAILS_URL = `https://x3dealpmov6br4o7vmtiy5peyq0wzbms.lambda-url.us-west-2.on.aws`;

@Injectable({ providedIn: 'root' })
export class TebexService extends AbstractFacadeService<TebexService> {
	public packages$$: SubscriberAwareBehaviorSubject<readonly TebexPackage[] | null>;

	protected api: ApiRunner;
	protected user: UserService;
	private ow: OverwolfService;
	private externalUrl: IExternalUrlService;
	private prefs: PreferencesService;

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
		this.prefs = AppInjector.get(PreferencesService);
		this.externalUrl = AppInjector.get(EXTERNAL_URL_SERVICE_TOKEN);
		this.user = AppInjector.get(UserService);

		this.packages$$.onFirstSubscribe(async () => {
			console.log('[ads] [tebex] will load packages');
			const result: readonly TebexPackage[] | null = await this.api.callGetApi(TEBEX_PACKAGES_URL);
			console.log('[ads] [tebex] loaded packages');
			console.debug('[ads] [tebex] loaded packages', result);
			this.packages$$.next(result);
		});
	}

	protected override async createElectronProxy(ipcRenderer: any) {
		this.packages$$ = new SubscriberAwareBehaviorSubject<readonly TebexPackage[] | null>(null);
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
		const prefs = await this.prefs.getPreferences();
		const locale = prefs.locale;
		const url = `https://subscriptions-api.overwolf.com/checkout/${STORE_PUBLIC_TOKEN}/${packageForPlan.id}?extensionId=${EXTENSION_ID}&userId=${userUuid}&locale=${locale}`;
		console.log('[ads] [tebex] opening url', url);
		this.externalUrl.openUrlInDefaultBrowser(url);
	}

	public async unsubscribe(planId: string) {
		const prefs = await this.prefs.getPreferences();
		const locale = prefs.locale;
		const paymentHistoryLink = `https://checkout.tebex.io/payment-history/recurring-payments?locale=${locale}`;
		this.externalUrl.openUrlInDefaultBrowser(paymentHistoryLink);
	}

	public async getSubscriptionStatus(): Promise<SubStatusResult> {
		return this.callOnMainProcess<SubStatusResult>('getSubscriptionStatusInternal');
	}

	protected async getSubscriptionStatusInternal(): Promise<SubStatusResult> {
		await waitForReady(this.user);
		console.log('[ads] [tebex] getting subscription status internal parent');
		const currentUser = await this.user.getCurrentUser();
		if (!currentUser?.username) {
			return null;
		}

		const owToken = await this.ow.generateSessionToken();
		let tebexPlans: readonly TebexSub[] | null;
		try {
			tebexPlans = await this.api.callGetApi<readonly TebexSub[]>(
				TEBEX_SUBSCRIPTIONS_URL,
				{
					bearerToken: owToken,
				},
				true,
			);
		} catch (e) {
			// We couldn't get a definitive answer from the server: don't treat this as "no subscription"
			console.warn('[ads] [tebex] could not fetch subscriptions', e);
			return SUB_STATUS_ERROR;
		}
		console.log('[ads] [tebex] tebexPlans', tebexPlans, owToken);
		if (!tebexPlans?.length) {
			return null;
		}

		const tebexPlan = tebexPlans[0];
		const packages = await this.packages$$.getValueWithInit();
		const tebexPackage = packages?.find((p) => p.id === tebexPlan.packageId);
		console.debug('[ads] [tebex] tebexPackage', tebexPackage);
		if (!tebexPackage) {
			// The user has a subscription, but we couldn't map it to a package (eg the packages list
			// failed to load): don't treat this as "no subscription"
			console.warn('[ads] [tebex] could not find package for sub', packages, tebexPlans);
			return SUB_STATUS_ERROR;
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

export interface TebexSub {
	userId: string;
	packageId: number;
	recurringPaymentId: string;
	state: 'ACTIVE' | 'PENDING_CANCELLATION' | 'EXPIRED' | 'CANCELLED';
}

interface TebexSubDetails {
	expiryDate: string;
}
