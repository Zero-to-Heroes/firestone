/** Marketing copy for /premium — English only (web i18n is CDN-backed). */
export const OVERWOLF_DOWNLOAD_URL =
	'https://download.overwolf.com/install/Download?Name=Firestone&ExtensionId=lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob&Channel=landing_page&PartnerId=4142';

/**
 * Premium marketing screenshots are served from the static CDN (same host as cards/i18n), not from the www web deploy bucket.
 *
 * Upload pipeline: `build-tools/upload-premium-static.sh` — WebP from `docs/premium/highres/`, videos from
 * `docs/premium/videos/` — to this path prefix (see `premiumCdnImage` / `premiumCdnVideo` in `premiumSections`):
 * `https://static.firestoneapp.com/premium/`
 *
 * For each **image**, prefer a **preview** file (smaller dimensions / stronger compression) plus a **full** file for the lightbox — see {@link PremiumImage.thumbSrc}. For **videos**, use {@link PremiumVideo} with `kind: 'video'` and optional {@link PremiumVideo.posterSrc}.
 *
 * Cache: after replacing a file in place, add or bump a `?v=` query on the URL in this file, or ship a new filename, so CDN/browser caches pick up the change.
 */
export const PREMIUM_CDN_IMAGES_BASE = 'https://static.firestoneapp.com/premium';

/** Build a full CDN URL for a file under {@link PREMIUM_CDN_IMAGES_BASE} (no leading slash on `filename`). */
export function premiumCdnImage(filename: string): string {
	const base = PREMIUM_CDN_IMAGES_BASE.replace(/\/$/, '');
	const path = filename.replace(/^\//, '');
	return `${base}/${path}?v=4`;
}

/** Same as {@link premiumCdnImage} — videos live under the same `premium/` prefix (e.g. `.mp4`, `.webm`). */
export function premiumCdnVideo(filename: string): string {
	return premiumCdnImage(filename);
}

/** Still image: opens in the lightbox at full resolution when clicked. */
export interface PremiumImage {
	readonly kind?: 'image';
	/** Full-resolution image for the lightbox (loaded on click). */
	readonly fullSrc: string;
	/**
	 * Smaller preview for the inline figure (reduces bandwidth on initial load).
	 * Omit to use {@link fullSrc} for both (same behavior as before thumbnails existed).
	 */
	readonly thumbSrc?: string;
	readonly alt: string;
	readonly caption?: string;
}

/**
 * Inline video (e.g. short screen capture). Use {@link kind} `'video'` so the page renders a `<video>` with
 * controls instead of a zoomable image. Host the file on the static CDN next to WebP assets.
 */
export interface PremiumVideo {
	readonly kind: 'video';
	readonly videoSrc: string;
	/** Optional poster frame (WebP/JPEG on the CDN) shown before playback. */
	readonly posterSrc?: string;
	readonly alt: string;
	readonly caption?: string;
}

export type PremiumMedia = PremiumImage | PremiumVideo;

/** @deprecated Prefer {@link PremiumMedia} — kept as an alias because the field is still named `screenshots`. */
export type PremiumScreenshot = PremiumMedia;

export function isPremiumVideo(m: PremiumMedia): m is PremiumVideo {
	return m.kind === 'video';
}

export function isPremiumImage(m: PremiumMedia): m is PremiumImage {
	return !isPremiumVideo(m);
}

/** One bullet under a mode section; optional `screenshots` can mix images and short videos. */
export interface PremiumFeatureItem {
	readonly text: string;
	readonly screenshots?: readonly PremiumMedia[];
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
			{
				text: 'Example boards on Composition details',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('battlegrounds-comp-details-thumb.webp'),
						fullSrc: premiumCdnImage('battlegrounds-comp-details.webp'),
						alt: 'Example boards on Composition details',
						caption: 'Example boards for the Pirate APM comp',
					},
				],
			},
			{
				text: 'Hero selection overlay with tiers and stats where it matters most during the initial selection',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('battlegrounds-hero-selection-thumb.webp'),
						fullSrc: premiumCdnImage('battlegrounds-hero-selection.webp'),
						alt: 'Battlegrounds hero selection overlay showing hero choices with tiers and stats during the pick phase',
						caption: 'Hero selection overlay with tiers and stats',
					},
				],
			},
			{ text: 'Trinket stats on the overlay' }, // Missing screenshot
			{
				text: 'Press Tab in the lobby for a quick full-hero overview',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('battlegrounds-quick-overview-thumb.webp'),
						fullSrc: premiumCdnImage('battlegrounds-quick-overview.webp'),
						alt: 'Quick overview of all heroes in the lobby',
						caption: 'Quick overview of all heroes in the lobby',
					},
				],
			},
			// { text: 'Strategy tips for your current hero in the overlay' },
			{
				text: 'Quest completion and reward placement context for your hero and MMR',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('battlegrounds-quest-reward-stats-thumb.webp'),
						fullSrc: premiumCdnImage('battlegrounds-quest-reward-stats.webp'),
						alt: 'Battlegrounds quest and reward stats in the overlay',
						caption: 'Quest completion and reward stats',
					},
				],
			},
			{
				text: 'Win/loss history against others in your lobby',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('battlegrounds-scoreboard-thumb.webp'),
						fullSrc: premiumCdnImage('battlegrounds-scoreboard.webp'),
						alt: 'Battlegrounds lobby history showing win/loss history against others in your lobby',
						caption: 'Win/loss history against others in your lobby',
					},
				],
			},
			{
				text: 'Rich in-game and post-match stats',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('battlegrounds-post-match-stats-thumb.webp'),
						fullSrc: premiumCdnImage('battlegrounds-post-match-stats.webp'),
						alt: 'Battlegrounds post-match stats showing rich in-game and post-match stats',
						caption: 'Rich in-game and post-match stats',
					},
				],
			},
			{
				text: 'Fight-by-fight win-rate outlook chart',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('battlegrounds-fight-by-fight-winrate-thumb.webp'),
						fullSrc: premiumCdnImage('battlegrounds-fight-by-fight-winrate.webp'),
						alt: 'Battlegrounds fight-by-fight win-rate outlook chart',
						caption: 'Fight-by-fight win-rate outlook chart',
					},
				],
			},
			{
				text: 'Hero page extras: tier summary, recent replays with that hero',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('battlegrounds-hero-stats-thumb.webp'),
						fullSrc: premiumCdnImage('battlegrounds-hero-stats.webp'),
						alt: 'Battlegrounds hero page extras showing recent replays with that hero',
						caption: 'Hero page extras: recent replays',
					},
				],
			},
			{
				text: 'Detailed recap stats for past matches in Replays',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('battlegrounds-past-match-stats-thumb.webp'),
						fullSrc: premiumCdnImage('battlegrounds-past-match-stats.webp'),
						alt: 'Battlegrounds replays stats showing detailed recap stats for past matches',
						caption: 'Detailed recap stats for past matches',
					},
				],
			},
			{ text: 'Auto-highlight minions in the tavern based on your hero' }, // Missing screenshot
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
				screenshots: [
					{
						thumbSrc: premiumCdnImage('constructed-meta-decks-overview-thumb.webp'),
						fullSrc: premiumCdnImage('constructed-meta-decks-overview.webp'),
						alt: 'Constructed meta stats showing current meta decks at the Legend rank',
						caption: 'Current meta decks at Legend rank',
					},
					{
						thumbSrc: premiumCdnImage('constructed-meta-archetypes-overview-thumb.webp'),
						fullSrc: premiumCdnImage('constructed-meta-archetypes-overview.webp'),
						alt: 'Constructed meta stats showing current meta archetypes for competitive players',
						caption: 'Current meta archetypes for Competitive rank brackets',
					},
					{
						thumbSrc: premiumCdnImage('constructed-meta-card-stats-thumb.webp'),
						fullSrc: premiumCdnImage('constructed-meta-card-stats.webp'),
						alt: 'Constructed meta stats showing detailed card stats for the Herald Rogue archetype',
						caption: 'Detailed card stats at the archetype level',
					},
				],
			},
			{
				text: 'Unlimited mulligan guide overlay',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('constructed-mulligan-guide-thumb.webp'),
						fullSrc: premiumCdnImage('constructed-mulligan-guide.webp'),
						alt: 'Constructed mulligan guide overlay',
						caption: 'Unlimited mulligan guide overlay',
					},
				],
			},
			{
				text: 'Deck overview and recent replays on the deck page',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('constructed-deck-details-thumb.webp'),
						fullSrc: premiumCdnImage('constructed-deck-details.webp'),
						alt: 'Constructed deck overview showing recent replays with that deck',
						caption: 'Deck overview and recent replays',
					},
				],
			},
			{
				text: 'Mulligan guide accessible in the lobby before queueing a game',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('constructed-lobby-mulligan-thumb.webp'),
						fullSrc: premiumCdnImage('constructed-lobby-mulligan.webp'),
						alt: 'Constructed mulligan guide accessible in the lobby before queueing a game',
						caption: 'Mulligan guide accessible in the lobby',
					},
				],
			},
			{ text: 'Unlimited Discover overlay stats' },
		],
	},
	{
		id: 'arena',
		title: 'Arena',
		icon: 'assets/svg/ftue/arena.svg',
		items: [
			{
				text: 'Unlimited class pick stats in the overlay',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('arena-class-stats-overlay-thumb.webp'),
						fullSrc: premiumCdnImage('arena-class-stats-overlay.webp'),
						alt: 'Unlimited class pick stats in the overlay',
						caption: 'Unlimited class pick stats in the overlay',
					},
				],
			},
			{
				text: 'Card pick stats in the overlay',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('arena-card-stats-overlay-thumb.webp'),
						fullSrc: premiumCdnImage('arena-card-stats-overlay.webp'),
						alt: 'Card pick stats in the overlay',
						caption: 'Card pick stats in the overlay',
					},
				],
			},
			{
				text: 'Unlimited mulligan guide overlay',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('arena-mulligan-guide-thumb.webp'),
						fullSrc: premiumCdnImage('arena-mulligan-guide.webp'),
						alt: 'Arena mulligan guide overlay',
						caption: 'Unlimited mulligan guide overlay',
					},
				],
			},
			{
				text: 'Additional insights on your Arena runs',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('arena-runs-overview-thumb.webp'),
						fullSrc: premiumCdnImage('arena-runs-overview.webp'),
						alt: 'Additional insights on your Arena runs',
						caption: 'Additional insights on your Arena runs',
					},
				],
			},
		],
	},
	{
		id: 'collection',
		title: 'Collection',
		icon: 'assets/svg/ftue/collection.svg',
		items: [
			{
				text: 'Detailed per-set collection stats',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('collection-stats-thumb.webp'),
						fullSrc: premiumCdnImage('collection-stats.webp'),
						alt: 'Detailed global collection stats',
						caption: 'Detailed global collection stats',
					},
					{
						thumbSrc: premiumCdnImage('collection-stats-for-set-thumb.webp'),
						fullSrc: premiumCdnImage('collection-stats-for-set.webp'),
						alt: 'Detailed per-set collection stats',
						caption: 'Detailed per-set collection stats',
					},
				],
			},
			{
				text: 'Chronological card and pack history',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('collection-pack-history-thumb.webp'),
						fullSrc: premiumCdnImage('collection-pack-history-history.webp'),
						alt: 'Chronological card and pack history',
						caption: 'Chronological card and pack history',
					},
				],
			},
		],
	},
	{
		id: 'general',
		title: 'General & replays',
		icon: 'assets/svg/ftue/replays.svg',
		items: [
			{
				text: 'Discord rich presence with custom status placeholders',
				screenshots: [
					{
						thumbSrc: premiumCdnImage('discord-status-thumb.webp'),
						fullSrc: premiumCdnImage('discord-status.webp'),
						alt: 'Discord rich presence with custom status placeholders',
						caption: 'Discord rich presence with custom status placeholders',
					},
				],
			},
			{
				text: 'Rich in-game replays',
				screenshots: [
					{
						kind: 'video',
						videoSrc: premiumCdnVideo('in-game-replay.mp4'),
						posterSrc: premiumCdnImage('in-game-replay-poster.webp'),
						alt: 'Rich in-game replay, with the original sounds and animations of the game',
						caption: 'Rich in-game replay, with the original sounds and animations of the game',
					},
				],
			},
		],
	},
];

export const subscribeSteps: readonly string[] = [
	'Install and open Firestone (Overwolf).',
	'Sign in with your Overwolf account when prompted.',
	'Open Premium from the heart icon or the Premium entry in the app, then choose a plan.',
	'Manage or cancel anytime via Tebex payment history — links are shown inside the Premium screen.',
];
