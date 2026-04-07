/** Marketing copy for /premium — English only (web i18n is CDN-backed). */
export const OVERWOLF_DOWNLOAD_URL =
	'https://download.overwolf.com/install/Download?Name=Firestone&ExtensionId=lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob&Channel=landing_page&PartnerId=4142';

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

export const premiumSections: readonly {
	readonly id: string;
	readonly title: string;
	readonly icon: string;
	readonly items: readonly string[];
}[] = [
	{
		id: 'battlegrounds',
		title: 'Battlegrounds',
		icon: 'assets/svg/ftue/battlegrounds.svg',
		items: [
			'Example boards on Composition details (meta comps)',
			'Hero selection overlay with tiers and stats where it matters most during the initial selection',
			'Quest and reward stats on the overlay',
			'Press Tab in the lobby for a quick full-hero overview',
			'Strategy tips for your current hero in the overlay',
			'Quest completion and reward placement context for your hero and MMR',
			'Auto-highlight minions in the tavern based on your hero',
			'Win/loss history against others in your lobby',
			'Rich in-game and post-match stats',
			'Fight-by-fight win-rate outlook chart',
			'Hero page extras: tier summary, recent replays with that hero',
			'Detailed recap stats for past matches in Replays',
			'Optional remote battle simulation when local sim is heavy on your PC',
		],
	},
	{
		id: 'constructed',
		title: 'Constructed',
		icon: 'assets/svg/ftue/decktracker.svg',
		items: [
			'Current meta by rank: decks, archetypes, and detailed per-card stats',
			'Deck overview and recent replays on the deck page',
			'Expanded deckbuilder layout',
			'Mulligan guide accessible in the lobby before queueing a game',
			'Unlimited Discover overlay stats',
			'Unlimited mulligan guide overlay',
		],
	},
	{
		id: 'arena',
		title: 'Arena',
		icon: 'assets/svg/ftue/arena.svg',
		items: [
			'Aggregated stats across all your Arena runs',
			'Class pick stats in the overlay',
			'Card pick stats in the overlay',
			'Unlimited mulligan guide overlay',
		],
	},
	{
		id: 'collection',
		title: 'Collection',
		icon: 'assets/svg/ftue/collection.svg',
		items: ['Chronological card and pack history', 'Detailed per-set collection stats'],
	},
	{
		id: 'general',
		title: 'General & replays',
		icon: 'assets/svg/ftue/replays.svg',
		items: ['Discord rich presence with custom status placeholders (where enabled)', 'Rich in-game replays'],
	},
];

export const subscribeSteps: readonly string[] = [
	'Install and open Firestone (Overwolf).',
	'Sign in with your Overwolf account when prompted.',
	'Open Premium from the heart icon or the Premium entry in the app, then choose a plan.',
	'Manage or cancel anytime via Tebex payment history — links are shown inside the Premium screen.',
];
