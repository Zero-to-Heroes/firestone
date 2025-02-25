import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject, deepEqual } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { distinctUntilChanged } from 'rxjs';
import { OwLegacyPremiumService } from './ow-legacy-premium.service';
import { TebexService } from './tebex.service';

@Injectable()
export class SubscriptionService extends AbstractFacadeService<SubscriptionService> {
	public currentPlan$$: SubscriberAwareBehaviorSubject<CurrentPlan>;

	private legacy: OwLegacyPremiumService;
	private tebex: TebexService;
	private localStorage: LocalStorageService;

	// private shouldCheckForUpdates = false;

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

		setInterval(() => {
			// if (!this.shouldCheckForUpdates) {
			// 	return;
			// }
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
		// this.startCheckingForUpdates();
	}

	private async unsubscribeInternal(planId: string) {
		if (planId === 'legacy') {
			await this.legacy.unsubscribe();
			this.currentPlan$$.next(null);
		}
		await this.tebex.unsubscribe(planId);
		// this.startCheckingForUpdates();
	}

	private async fetchCurrentPlanInternal(): Promise<CurrentPlan> {
		const currentPlan = await this.getCurrentPlanInternal();
		// Once it is initialized, it should not be null, otherwise the getValueWithInit() will hang indefinitely
		this.currentPlan$$.next(currentPlan ?? null);
		this.localStorage.setItem(LocalStorageService.CURRENT_SUB_PLAN, currentPlan);
		return currentPlan;
	}

	private async getCurrentPlanInternal(): Promise<CurrentPlan> {
		const tebexPlan = await this.tebex.getSubscriptionStatus();
		if (tebexPlan != null) {
			return tebexPlan;
		}

		const legacyPlan = await this.legacy.getSubscriptionStatus();
		if (legacyPlan != null) {
			return legacyPlan;
		}
		return null;
	}

	// private startCheckingForUpdates() {
	// 	this.shouldCheckForUpdates = true;
	// 	setTimeout(() => (this.shouldCheckForUpdates = false), 10 * 60 * 1000);
	// }
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

export type PremiumPlanId = 'legacy' | 'friend' | 'premium' | 'epic';
export const premiumPlanIds = ['legacy', 'premium', 'epic'] as PremiumPlanId[];
