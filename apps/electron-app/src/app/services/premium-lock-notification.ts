import { Notification } from 'electron';
import { isAppAccessUnlocked, REQUIRE_PREMIUM_FOR_FULL_APP } from './app-access-policy';

let premiumLockNotificationShown = false;

/**
 * One native Windows (or other OS) notification per app session if the app is locked
 * to premium users only.
 */
export function showPremiumLockNotificationOnce(): void {
	if (!REQUIRE_PREMIUM_FOR_FULL_APP) {
		return;
	}
	if (premiumLockNotificationShown) {
		return;
	}
	if (isAppAccessUnlocked()) {
		return;
	}
	if (!Notification.isSupported()) {
		return;
	}
	premiumLockNotificationShown = true;
	new Notification({
		title: 'Firestone',
		body: 'Log in with a premium Firestone account to use the standalone app and overlay.',
	}).show();
}
