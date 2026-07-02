import { app as electronApp } from 'electron';
import { isFreeFlavor } from './flavor';

/** Set to true when we are ready to show the built-in ow-electron consent UI. */
const CMP_ENABLED = false;

/**
 * Consent Management Platform (CMP) handling for the FREE (ad-supported) build.
 *
 * CMP is a built-in ow-electron runtime API (`app.overwolf.isCMPRequired()` / `openCMPWindow()`),
 * not an `overwolf.packages` entry. The premium build never calls these APIs, so it has no
 * consent UI and no dependency on the Overwolf installer.
 *
 * `isCMPRequired()` already encodes whether the user still needs to be informed/give consent
 * (e.g. GDPR regions, not yet consented), so we don't need our own first-run bookkeeping.
 */
export async function maybeShowConsentOnStartup(): Promise<void> {
	if (!CMP_ENABLED) {
		return;
	}
	if (!isFreeFlavor()) {
		// Premium / ad-free build: never touch the CMP APIs.
		return;
	}
	try {
		const overwolf = (electronApp as any).overwolf;
		if (typeof overwolf?.isCMPRequired !== 'function') {
			console.log('[cmp] CMP API not available, skipping');
			return;
		}
		const required = await overwolf.isCMPRequired();
		console.log('[cmp] isCMPRequired:', required);
		if (required) {
			overwolf.openCMPWindow();
		}
	} catch (e) {
		console.error('[cmp] failed to evaluate/show consent', e);
	}
}

/** Reopen the consent window on demand (e.g. from a settings entry). Free build only. */
export function openConsentWindow(): void {
	if (!CMP_ENABLED) {
		return;
	}
	if (!isFreeFlavor()) {
		return;
	}
	try {
		const overwolf = (electronApp as any).overwolf;
		overwolf?.openCMPWindow?.();
	} catch (e) {
		console.error('[cmp] failed to open consent window', e);
	}
}
