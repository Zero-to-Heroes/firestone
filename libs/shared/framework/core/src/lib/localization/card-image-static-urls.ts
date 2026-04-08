/** Base URL for Firestone CDN card art (no trailing slash). */
export const FIRESTONE_STATIC_CARD_IMAGES_BASE = 'https://static.firestoneapp.com/cards';

/** Base URL for pre-release card art (same path layout as {@link FIRESTONE_STATIC_CARD_IMAGES_BASE}). */
export const FIRESTONE_STATIC_PRERELEASE_CARD_IMAGES_BASE = 'https://static.firestoneapp.com/pre-release/cards';

/** Rewrite a canonical Firestone card image URL to the pre-release CDN path. */
export function toPreReleaseFirestoneCardImageUrl(usualUrl: string): string {
	return usualUrl.replace(
		`${FIRESTONE_STATIC_CARD_IMAGES_BASE}/`,
		`${FIRESTONE_STATIC_PRERELEASE_CARD_IMAGES_BASE}/`,
	);
}
