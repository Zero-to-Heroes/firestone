// No-op ad-serving module for the PREMIUM (ad-free) standalone build.
//
// This file replaces `ow-electron-ads.ts` via Angular fileReplacements in the premium build,
// guaranteeing that no ad-serving code (no `<owadview>`, no `OwAd` global) is bundled.

export function setupOwElectronAds(): void {
	// Intentionally empty: the premium build serves no ads.
}
