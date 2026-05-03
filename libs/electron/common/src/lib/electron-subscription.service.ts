/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { TebexHeadlessService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	CurrentPlan,
	equalCurrentPlan,
	LocalStorageService,
	UserService,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ElectronSubscriptionService extends AbstractFacadeService<ElectronSubscriptionService> {
	public currentPlan$$: SubscriberAwareBehaviorSubject<CurrentPlan | null>;

	private tebex: TebexHeadlessService;
	private localStorage: LocalStorageService;
	private user: UserService;

	// Do this to avoid spamming the server with subscription status check messages
	private shouldCheckForUpdates = false;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ElectronSubscriptionService', () => !!this.currentPlan$$);
	}

	protected override assignSubjects() {
		this.currentPlan$$ = this.mainInstance.currentPlan$$;
	}

	protected async init() {
		this.currentPlan$$ = new SubscriberAwareBehaviorSubject<CurrentPlan | null>(null);
		this.tebex = AppInjector.get(TebexHeadlessService);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.user = AppInjector.get(UserService);

		await waitForReady(this.tebex, this.user);

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

		await waitForReady(this.user);
		this.user.user$$.pipe(debounceTime(500)).subscribe((user) => {
			console.log('[ads] [subscription] user changed, fetching new plan', user);
			this.fetchCurrentPlan();
			// this.startCheckingForUpdates();
		});

		setInterval(() => {
			if (!this.shouldCheckForUpdates) {
				return;
			}
			this.fetchCurrentPlan();
		}, 60 * 1000);
	}

	protected override initElectronSubjects(): void {
		this.setupElectronSubject(this.currentPlan$$, 'ElectronSubscriptionService-currentPlan');
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.currentPlan$$ = new SubscriberAwareBehaviorSubject<CurrentPlan | null>(null);
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('subscribeInternal', (planId: string) => this.subscribeInternal(planId));
		this.registerMainProcessMethod('unsubscribeInternal', (planId: string) => this.unsubscribeInternal(planId));
		this.registerMainProcessMethod('fetchCurrentPlanInternal', () => this.fetchCurrentPlanInternal());
	}

	public async subscribe(planId: string) {
		return this.callOnMainProcess('subscribeInternal', planId);
	}

	public async unsubscribe(planId: string) {
		return this.callOnMainProcess('unsubscribeInternal', planId);
	}

	public async fetchCurrentPlan(): Promise<CurrentPlan | null> {
		console.log('[ads] [subscription] fetching current plan');
		return this.callOnMainProcess<CurrentPlan | null>('fetchCurrentPlanInternal');
	}

	private async subscribeInternal(planId: string) {
		await this.tebex.subscribe(planId);
		this.startCheckingForUpdates();
	}

	private async unsubscribeInternal(planId: string) {
		await this.tebex.unsubscribe(planId);
		this.startCheckingForUpdates();
	}

	private async fetchCurrentPlanInternal(): Promise<CurrentPlan | null> {
		console.log('[ads] [subscription] fetching current plan internal');
		const currentPlan = await this.getCurrentPlanInternal();
		console.debug('[ads] [subscription] current plan', currentPlan);
		// Once it is initialized, it should not be null, otherwise the getValueWithInit() will hang indefinitely
		const existingPlan = await this.currentPlan$$.getValueWithInit();
		if (equalCurrentPlan(existingPlan, currentPlan)) {
			return existingPlan;
		}

		this.currentPlan$$.next(
			currentPlan
				? {
						...currentPlan,
						expireAt: currentPlan.expireAt ? new Date(currentPlan.expireAt) : null,
					}
				: null,
		);
		this.localStorage.setItem(LocalStorageService.CURRENT_SUB_PLAN, currentPlan);
		return currentPlan;
	}

	private async getCurrentPlanInternal(): Promise<CurrentPlan | null> {
		console.log('[ads] [subscription] getting current plan internal');
		const tebexPlan = await this.tebex.getSubscriptionStatus();
		console.log('[ads] [subscription] tebex plan', tebexPlan);
		return tebexPlan;
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

// export interface CurrentPlan {
// 	readonly id: PremiumPlanId;
// 	readonly expireAt: Date | null;
// 	readonly active: boolean;
// 	readonly cancelled: boolean;
// 	readonly autoRenews: boolean;
// 	readonly discordCode?: string;
// }
// export const equalCurrentPlan = (a: CurrentPlan | null | undefined, b: CurrentPlan | null | undefined): boolean => {
// 	const expireA = a?.expireAt ? new Date(a.expireAt) : null;
// 	const expireB = b?.expireAt ? new Date(b.expireAt) : null;
// 	return (
// 		a?.active === b?.active &&
// 		a?.id === b?.id &&
// 		a?.autoRenews === b?.autoRenews &&
// 		a?.cancelled === b?.cancelled &&
// 		a?.discordCode === b?.discordCode &&
// 		(!!expireA && !!expireB ? expireA.getTime() === expireB.getTime() : expireA == expireB)
// 	);
// };

// export type PremiumPlanId = 'legacy' | 'premium' | 'premium-annual' | 'premium-six-months';
// export const premiumPlanIds = ['legacy', 'premium', 'premium-annual', 'premium-six-months'] as PremiumPlanId[];
