import { StandaloneUserService } from '@firestone/electron/common';
import {
	ADS_SERVICE_TOKEN,
	AppInjector,
	IAdsService,
	USER_SERVICE_TOKEN,
	waitForReady,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Subscription } from 'rxjs';
import { isPremiumFlavor } from './flavor';

/**
 * When true, the full app is enabled (windows, overlay injection, hotkeys that open UI).
 * Sources of truth: IUserService (logged in) + IAdsService (enablePremiumFeatures$$).
 *
 * Derived from the build flavor: the premium-only build (`standalone-premium`) requires premium,
 * while the free/ad-supported build (`standalone`) lets non-premium users use the app.
 */
export const REQUIRE_PREMIUM_FOR_FULL_APP = true || isPremiumFlavor();

/** Emits whether the app should allow all UI. Subscribe from tray, or call isAppAccessUnlocked() synchronously. */
export const appAccessUnlocked$$ = new BehaviorSubject<boolean>(false);

let combineSubscription: Subscription | null = null;
let appAccessPolicyInitialized = false;

/**
 * Call once after buildAppInjector(), with StandaloneUserService and IAdsService registered.
 */
export async function initAppAccessPolicy(): Promise<void> {
	if (appAccessPolicyInitialized) {
		return;
	}
	appAccessPolicyInitialized = true;

	if (!REQUIRE_PREMIUM_FOR_FULL_APP) {
		appAccessUnlocked$$.next(true);
		return;
	}

	const userService = AppInjector.get(USER_SERVICE_TOKEN) as StandaloneUserService;
	const ads = AppInjector.get(ADS_SERVICE_TOKEN) as IAdsService;

	await waitForReady(userService, ads);

	combineSubscription?.unsubscribe();
	combineSubscription = combineLatest([userService.user$$, ads.enablePremiumFeatures$$])
		.pipe(
			map(([user, enablePremium]) => !!user?.username && enablePremium === true),
			distinctUntilChanged(),
		)
		.subscribe((unlocked) => {
			console.log('[app-access] full app unlocked:', unlocked);
			appAccessUnlocked$$.next(unlocked);
		});
}

export function isAppAccessUnlocked(): boolean {
	if (!REQUIRE_PREMIUM_FOR_FULL_APP) {
		return true;
	}
	return appAccessUnlocked$$.getValue();
}

export function disposeAppAccessPolicy(): void {
	combineSubscription?.unsubscribe();
	combineSubscription = null;
	appAccessPolicyInitialized = false;
}
