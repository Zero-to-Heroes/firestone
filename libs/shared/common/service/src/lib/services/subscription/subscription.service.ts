import { Injectable } from '@angular/core';
import { deepEqual, SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	LocalStorageService,
	OverwolfService,
	UserService,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { OwLegacyPremiumService } from './ow-legacy-premium.service';
import { TebexService } from './tebex.service';

@Injectable()
export class SubscriptionService extends AbstractFacadeService<SubscriptionService> {
	public currentPlan$$: SubscriberAwareBehaviorSubject<CurrentPlan>;

	private legacy: OwLegacyPremiumService;
	private tebex: TebexService;
	private localStorage: LocalStorageService;
	private ow: OverwolfService;
	private user: UserService;

	// Do this to avoid spamming the server with subscription status check messages
	private shouldCheckForUpdates = false;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'premiumSubscription', () => !!this.currentPlan$$);
	}

	protected override assignSubjects() {
		this.currentPlan$$ = this.mainInstance.currentPlan$$;
	}

	protected async init() {
		this.currentPlan$$ = new SubscriberAwareBehaviorSubject<CurrentPlan>(undefined);
		this.legacy = AppInjector.get(OwLegacyPremiumService);
		this.tebex = AppInjector.get(TebexService);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.ow = AppInjector.get(OverwolfService);
		this.user = AppInjector.get(UserService);

		this.currentPlan$$.onFirstSubscribe(async () => {
			const localPlan = this.localStorage.getItem<CurrentPlan>(LocalStorageService.CURRENT_SUB_PLAN);
			if (localPlan) {
				this.currentPlan$$.next(localPlan);
			}

			this.currentPlan$$.pipe(distinctUntilChanged((a, b) => deepEqual(a, b))).subscribe((plan) => {
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

	public async subscribe(planId: string) {
		return this.mainInstance.subscribeInternal(planId);
	}

	public async unsubscribe(planId: string) {
		return this.mainInstance.unsubscribeInternal(planId);
	}

	public async fetchCurrentPlan(): Promise<CurrentPlan> {
		return this.mainInstance.fetchCurrentPlanInternal();
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

	private async fetchCurrentPlanInternal(): Promise<CurrentPlan> {
		const currentPlan = await this.getCurrentPlanInternal();
		console.debug('[ads] [subscription] current plan', currentPlan);
		// Once it is initialized, it should not be null, otherwise the getValueWithInit() will hang indefinitely
		this.currentPlan$$.next(currentPlan ?? null);
		this.localStorage.setItem(LocalStorageService.CURRENT_SUB_PLAN, currentPlan);
		return currentPlan;
	}

	private async getCurrentPlanInternal(): Promise<CurrentPlan> {
		const tebexPlan = await this.tebex.getSubscriptionStatus();
		console.log('[ads] [subscription] tebex plan', tebexPlan);
		if (tebexPlan != null) {
			return tebexPlan;
		}

		const legacyPlan = await this.legacy.getSubscriptionStatus();
		console.log('[ads] [subscription] legacy plan', legacyPlan);
		if (legacyPlan != null) {
			return legacyPlan;
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

export interface CurrentPlan {
	readonly id: PremiumPlanId;
	readonly expireAt: Date | null;
	readonly active: boolean;
	readonly cancelled: boolean;
	readonly autoRenews: boolean;
	readonly discordCode?: string;
}

export interface OwSub {
	readonly id: number;
	readonly username: string;
	readonly expireAt: Date;
	readonly state: number;
}

export type PremiumPlanId = 'legacy' | 'premium' | 'premium-annual';
export const premiumPlanIds = ['legacy', 'premium'] as PremiumPlanId[];
