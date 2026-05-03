import { InjectionToken } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export const ADS_SERVICE_TOKEN = new InjectionToken<IAdsService>('AdsService');
export interface IAdsService {
	enablePremiumFeatures$$: BehaviorSubject<boolean>;
	hasPremiumSub$$: BehaviorSubject<boolean>;
	currentPlan$$: BehaviorSubject<CurrentPlan | null>;

	isReady(): Promise<void>;
	goToPremium(): Promise<void>;
	/**
	 * SSO / deep-link may include `isPremium` before Tebex responds. Main window applies this so tray
	 * and app access update immediately; `currentPlan` from Tebex still overwrites if it disagrees.
	 */
	applyAuthPremiumHint(isPremium: boolean): void;
	subscribe(planId: string): void;
	unsubscribe(planId: string): void;
}

export interface CurrentPlan {
	readonly id: PremiumPlanId;
	readonly expireAt: Date | null;
	readonly active: boolean;
	readonly cancelled: boolean;
	readonly autoRenews: boolean;
	readonly discordCode?: string;
}
export const equalCurrentPlan = (a: CurrentPlan | null | undefined, b: CurrentPlan | null | undefined): boolean => {
	const expireA = a?.expireAt ? new Date(a.expireAt) : null;
	const expireB = b?.expireAt ? new Date(b.expireAt) : null;
	return (
		a?.active === b?.active &&
		a?.id === b?.id &&
		a?.autoRenews === b?.autoRenews &&
		a?.cancelled === b?.cancelled &&
		a?.discordCode === b?.discordCode &&
		(!!expireA && !!expireB ? expireA.getTime() === expireB.getTime() : expireA == expireB)
	);
};

export type PremiumPlanId = 'legacy' | 'premium' | 'premium-annual' | 'premium-six-months';
export const premiumPlanIds = ['legacy', 'premium', 'premium-annual', 'premium-six-months'] as PremiumPlanId[];

/**
 * True when the user has an active premium plan. Tebex sets `CurrentPlan.id` from package
 * product names (e.g. "Premium Annual" → "premium annual"), so we normalize and match
 * against {@link premiumPlanIds} instead of using strict `includes(plan.id)` only.
 */
export function isActivePremiumPlan(plan: CurrentPlan | null | undefined): boolean {
	if (plan == null || plan.active === false) {
		return false;
	}
	if (premiumPlanIds.includes(plan.id as PremiumPlanId)) {
		return true;
	}
	const raw = String(plan.id ?? '');
	const n = raw
		.toLowerCase()
		.replace(/[\s_]+/g, '-')
		.replace(/-+/g, '-');
	if (premiumPlanIds.includes(n as PremiumPlanId)) {
		return true;
	}
	if (premiumPlanIds.some((p) => n === p || n.startsWith(p + '-'))) {
		return true;
	}
	const segments = new Set(n.split('-').filter(Boolean));
	return premiumPlanIds.some((p) => segments.has(p));
}
