/** Marketing copy for /premium — English only (web i18n is CDN-backed). */
export const OVERWOLF_DOWNLOAD_URL =
	'https://download.overwolf.com/install/Download?Name=Firestone&ExtensionId=lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob&Channel=landing_page&PartnerId=4142';

/**
 * Premium marketing screenshots are served from the static CDN (same host as cards/i18n), not from the www web deploy bucket.
 *
 * Upload pipeline: publish optimized WebP under this path prefix (see `premiumCdnImage()` on feature `screenshots` in `premiumSections`):
 * `https://static.firestoneapp.com/premium/`
 *
 * Cache: after replacing a file in place, add or bump a `?v=` query on the URL in this file, or ship a new filename, so CDN/browser caches pick up the change.
 */
export const PREMIUM_CDN_IMAGES_BASE = 'https://static.firestoneapp.com/premium';

/** Build a full CDN URL for a file under {@link PREMIUM_CDN_IMAGES_BASE} (no leading slash on `filename`). */
export function premiumCdnImage(filename: string): string {
	const base = PREMIUM_CDN_IMAGES_BASE.replace(/\/$/, '');
	const path = filename.replace(/^\//, '');
	return `${base}/${path}`;
}

export interface PremiumScreenshot {
	readonly src: string;
	readonly alt: string;
	readonly caption?: string;
}

/** One bullet under a mode section; optional screenshots illustrate that specific feature. */
export interface PremiumFeatureItem {
	readonly text: string;
	readonly screenshots?: readonly PremiumScreenshot[];
}

export interface PremiumSection {
	readonly id: string;
	readonly title: string;
	readonly icon: string;
	readonly items: readonly PremiumFeatureItem[];
}

export const premiumHero = {
	title: 'Firestone Premium',
	subtitle:
		'Unlock the full companion experience: deeper stats on every screen, unlimited in-game overlays, no ads, and more ways to improve faster.',
};

export const premiumSummaryBullets: readonly string[] = [
	'Remove in-app advertising',
	'Unlimited use of Discover and Mulligan overlays in Traditional Hearthstone, and Battlegrounds pick and stats overlays (free users have daily or weekly limits)',
	'Full meta deck and archetype analytics, card-level breakdowns, and richer deck pages in the app',
	'Battlegrounds hero selection overlay, quest and reward stats, tips, auto-highlighting, lobby insights, and post-game breakdowns',
	'Support ongoing development of Firestone',
];

export const premiumSections: readonly PremiumSection[] = [
	{
		id: 'battlegrounds',
		title: 'Battlegrounds',
		icon: 'assets/svg/ftue/battlegrounds.svg',
		items: [
			{ text: 'Example boards on Composition details (meta comps)' },
			{
				text: 'Hero selection overlay with tiers and stats where it matters most during the initial selection',
				screenshots: [
					{
						src: premiumCdnImage('battlegrounds-hero-selection.webp'),
						alt: 'Battlegrounds hero selection overlay showing hero choices with tiers and stats during the pick phase',
						caption: 'Hero selection overlay with tiers and stats',
					},
				],
			},
			{ text: 'Quest and reward stats on the overlay' },
			{ text: 'Press Tab in the lobby for a quick full-hero overview' },
			{ text: 'Strategy tips for your current hero in the overlay' },
			{ text: 'Quest completion and reward placement context for your hero and MMR' },
			{ text: 'Auto-highlight minions in the tavern based on your hero' },
			{ text: 'Win/loss history against others in your lobby' },
			{ text: 'Rich in-game and post-match stats' },
			{ text: 'Fight-by-fight win-rate outlook chart' },
			{ text: 'Hero page extras: tier summary, recent replays with that hero' },
			{ text: 'Detailed recap stats for past matches in Replays' },
			{ text: 'Optional remote battle simulation when local sim is heavy on your PC' },
		],
	},
	{
		id: 'constructed',
		title: 'Constructed',
		icon: 'assets/svg/ftue/decktracker.svg',
		items: [
			{
				text: 'Current meta by rank: decks, archetypes, and detailed per-card stats',
			},
			{ text: 'Deck overview and recent replays on the deck page' },
			{ text: 'Expanded deckbuilder layout' },
			{ text: 'Mulligan guide accessible in the lobby before queueing a game' },
			{ text: 'Unlimited Discover overlay stats' },
			{ text: 'Unlimited mulligan guide overlay' },
		],
	},
	{
		id: 'arena',
		title: 'Arena',
		icon: 'assets/svg/ftue/arena.svg',
		items: [
			{ text: 'Aggregated stats across all your Arena runs' },
			{ text: 'Class pick stats in the overlay' },
			{ text: 'Card pick stats in the overlay' },
			{ text: 'Unlimited mulligan guide overlay' },
		],
	},
	{
		id: 'collection',
		title: 'Collection',
		icon: 'assets/svg/ftue/collection.svg',
		items: [{ text: 'Chronological card and pack history' }, { text: 'Detailed per-set collection stats' }],
	},
	{
		id: 'general',
		title: 'General & replays',
		icon: 'assets/svg/ftue/replays.svg',
		items: [
			{ text: 'Discord rich presence with custom status placeholders (where enabled)' },
			{ text: 'Rich in-game replays' },
		],
	},
];

export const subscribeSteps: readonly string[] = [
	'Install and open Firestone (Overwolf).',
	'Sign in with your Overwolf account when prompted.',
	'Open Premium from the heart icon or the Premium entry in the app, then choose a plan.',
	'Manage or cancel anytime via Tebex payment history — links are shown inside the Premium screen.',
];
