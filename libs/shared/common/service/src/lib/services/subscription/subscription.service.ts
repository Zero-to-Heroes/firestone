/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ACCOUNT_SERVICE_TOKEN,
	AppInjector,
	CurrentPlan,
	equalCurrentPlan,
	IAccountFacadeForCollection,
	LocalStorageService,
	OverwolfService,
	UserService,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { OwLegacyPremiumService } from './ow-legacy-premium.service';
import { resolveNewPlan, SUB_STATUS_ERROR, SubStatusResult } from './subscription-status';
import { TebexService } from './tebex.service';

@Injectable()
export class SubscriptionService extends AbstractFacadeService<SubscriptionService> {
	public currentPlan$$: SubscriberAwareBehaviorSubject<CurrentPlan | null>;

	private legacy: OwLegacyPremiumService;
	private tebex: TebexService;
	private localStorage: LocalStorageService;
	private ow: OverwolfService;
	private user: UserService;
	private account: IAccountFacadeForCollection;

	// Do this to avoid spamming the server with subscription status check messages
	private shouldCheckForUpdates = false;
	/** Consecutive {@link SUB_STATUS_ERROR} answers while a plan is cached; reset on any definitive reply. */
	private consecutiveStatusErrors = 0;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'SubscriptionService', () => !!this.currentPlan$$);
	}

	protected override assignSubjects() {
		this.currentPlan$$ = this.mainInstance.currentPlan$$;
	}

	protected async init() {
		this.currentPlan$$ = new SubscriberAwareBehaviorSubject<CurrentPlan | null>(null);
		this.legacy = AppInjector.get(OwLegacyPremiumService);
		this.tebex = AppInjector.get(TebexService);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.ow = AppInjector.get(OverwolfService);
		this.user = AppInjector.get(UserService);
		this.account = AppInjector.get(ACCOUNT_SERVICE_TOKEN);

		this.currentPlan$$.onFirstSubscribe(async () => {
			const localPlan = this.localStorage.getItem<CurrentPlan>(LocalStorageService.CURRENT_SUB_PLAN);
			if (localPlan) {
				this.currentPlan$$.next({
					...localPlan,
					expireAt: localPlan.expireAt ? new Date(localPlan.expireAt) : null,
				});
			}

			this.currentPlan$$.pipe(distinctUntilChanged((a, b) => equalCurrentPlan(a, b))).subscribe((plan) => {
				console.log('[ads] [subscription] new plan', plan);
			});

			await this.fetchCurrentPlan();
		});

		this.ow.onSubscriptionChanged(() => {
			console.log('[ads] [subscription]ow  subscription changed, fetching new plan');
			this.startCheckingForUpdates();
		});

		await waitForReady(this.user);
		this.user.user$$.pipe(debounceTime(500)).subscribe(() => {
			console.log('[ads] [subscription] user changed, fetching new plan');
			this.startCheckingForUpdates();
		});

		setInterval(() => {
			if (!this.shouldCheckForUpdates) {
				return;
			}
			this.fetchCurrentPlan();
		}, 60 * 1000);
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('subscribeInternal', (planId: string) => this.subscribeInternal(planId));
		this.registerMainProcessMethod('unsubscribeInternal', (planId: string) => this.unsubscribeInternal(planId));
		this.registerMainProcessMethod('fetchCurrentPlanInternal', () => this.fetchCurrentPlanInternal());
	}

	protected override initElectronSubjects(): void {
		this.setupElectronSubject(this.currentPlan$$, 'SubscriptionService-currentPlan');
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.currentPlan$$ = new SubscriberAwareBehaviorSubject<CurrentPlan | null>(null);
	}

	public async subscribe(planId: string) {
		return this.callOnMainProcess('subscribeInternal', planId);
	}

	public async unsubscribe(planId: string) {
		return this.callOnMainProcess('unsubscribeInternal', planId);
	}

	public async fetchCurrentPlan(): Promise<CurrentPlan | null> {
		return this.callOnMainProcess<CurrentPlan | null>('fetchCurrentPlanInternal');
	}

	private async subscribeInternal(planId: string) {
		if (planId === 'legacy') {
			await this.legacy.subscribe();
			// this.currentPlan$$.next({ id: 'legacy', expireAt: null, active: true, autoRenews: false, cancelled: false });
		}
		await this.tebex.subscribe(planId);
		this.startCheckingForUpdates();
	}

	private async unsubscribeInternal(planId: string) {
		if (planId === 'legacy') {
			await this.legacy.unsubscribe();
		} else {
			await this.tebex.unsubscribe(planId);
		}
		this.startCheckingForUpdates();
	}

	private async fetchCurrentPlanInternal(): Promise<CurrentPlan | null> {
		const fetchResult = await this.getCurrentPlanInternal();
		console.debug('[ads] [subscription] current plan', fetchResult);
		// Once it is initialized, it should not be null, otherwise the getValueWithInit() will hang indefinitely
		const existingPlan = await this.currentPlan$$.getValueWithInit();
		if (fetchResult === SUB_STATUS_ERROR) {
			this.consecutiveStatusErrors++;
		} else {
			this.consecutiveStatusErrors = 0;
		}
		const { plan, shouldUpdate } = resolveNewPlan(fetchResult, existingPlan, this.consecutiveStatusErrors);
		if (!shouldUpdate) {
			if (fetchResult === SUB_STATUS_ERROR) {
				console.warn(
					'[ads] [subscription] could not get a definitive subscription status, keeping last-known plan',
					plan,
					'consecutiveErrors=',
					this.consecutiveStatusErrors,
				);
			}
			return plan;
		}

		if (fetchResult === SUB_STATUS_ERROR && plan == null) {
			console.warn(
				'[ads] [subscription] expiring cached premium after prolonged unverifiable status',
				this.consecutiveStatusErrors,
			);
		}

		this.currentPlan$$.next(
			plan
				? {
						...plan,
						expireAt: plan.expireAt ? new Date(plan.expireAt) : null,
					}
				: null,
		);
		this.localStorage.setItem(LocalStorageService.CURRENT_SUB_PLAN, plan);
		return plan;
	}

	private async getCurrentPlanInternal(): Promise<SubStatusResult> {
		const tebexPlan = await this.tebex.getSubscriptionStatus();
		console.log('[ads] [subscription] tebex plan', tebexPlan);
		if (tebexPlan != null && tebexPlan !== SUB_STATUS_ERROR) {
			return tebexPlan;
		}

		const legacyPlan = await this.legacy.getSubscriptionStatus();
		console.log('[ads] [subscription] legacy plan', legacyPlan);
		if (legacyPlan != null && legacyPlan !== SUB_STATUS_ERROR) {
			return legacyPlan;
		}

		// If any source errored out, we don't have a definitive "no subscription" answer
		if (tebexPlan === SUB_STATUS_ERROR || legacyPlan === SUB_STATUS_ERROR) {
			return SUB_STATUS_ERROR;
		}
		return null;
	}

	private startCheckingForUpdates() {
		if (this.shouldCheckForUpdates) {
			return;
		}
		this.shouldCheckForUpdates = true;
		this.fetchCurrentPlan();
		setTimeout(() => (this.shouldCheckForUpdates = false), 4 * 60 * 1000);
	}
}

export interface OwSub {
	readonly id: number;
	readonly username: string;
	readonly expireAt: Date;
	readonly state: number;
}
