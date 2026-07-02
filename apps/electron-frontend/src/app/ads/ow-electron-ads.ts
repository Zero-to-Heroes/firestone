// Ad-serving code for the FREE (ad-supported) standalone build.
//
// ow-electron serves ads through the built-in `<owadview>` tag (tied to the app's unique id,
// which must be registered with Overwolf for ad inventory). The existing `<single-ad>` UI
// component (libs/legacy/feature-shell) is written against the Overwolf-platform `OwAd` API,
// so to reuse that UI without touching shared/legacy code we expose a small `OwAd`-compatible
// shim backed by `<owadview>`.
//
// IMPORTANT: this whole file is excluded from the premium build. The premium build replaces it
// with `ow-electron-ads.stub.ts` (a no-op) via Angular fileReplacements, so no ad-serving code
// is bundled there.

interface OwAdParams {
	size?: { width: number; height: number };
	enableHighImpact?: boolean;
}

class OwElectronAd {
	private listeners = new Map<string, Array<(message?: any) => void>>();
	private adView: HTMLElement | null = null;

	constructor(container: HTMLElement, _params?: OwAdParams) {
		try {
			// `owadview` is a built-in ow-electron tag; it auto-manages ad rendering and lifecycle.
			const adView = document.createElement('owadview');
			adView.style.width = '100%';
			adView.style.height = '100%';
			// Transparent background lets a fallback background image show when there is no ad inventory.
			adView.style.background = 'transparent';
			container.appendChild(adView);
			this.adView = adView;
			console.log('[ow-electron-ads] created owadview');
		} catch (e) {
			console.error('[ow-electron-ads] failed to create owadview', e);
		}
	}

	// The `<single-ad>` component registers/unregisters event listeners; owadview is self-managed,
	// so these are accepted but never fired. Kept API-compatible to avoid runtime errors.
	addEventListener(event: string, callback: (message?: any) => void): void {
		const existing = this.listeners.get(event) ?? [];
		existing.push(callback);
		this.listeners.set(event, existing);
	}

	removeEventListener(callback: (message?: any) => void): void {
		for (const [event, callbacks] of this.listeners) {
			this.listeners.set(
				event,
				callbacks.filter((cb) => cb !== callback),
			);
		}
	}

	refreshAd(): void {
		// owadview refreshes itself; nothing to do.
	}

	removeAd(): void {
		this.adView?.remove();
		this.adView = null;
	}
}

/**
 * Enables ad serving for the free build by exposing an `OwAd`-compatible global backed by `<owadview>`.
 * Must run before the Angular app bootstraps so the existing `<single-ad>` UI can pick it up.
 */
export function setupOwElectronAds(): void {
	const globalWindow = window as any;
	globalWindow.OwAd = OwElectronAd;
	globalWindow.adsReady = true;
	console.log('[ow-electron-ads] ad-serving enabled (owadview)');
}
