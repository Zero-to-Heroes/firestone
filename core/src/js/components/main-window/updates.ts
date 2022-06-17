export interface Update {
	readonly sections: readonly UpdateSection[];
	readonly version: string;
}

export interface UpdateSection {
	readonly type: 'intro' | 'main' | 'minor' | 'beta' | 'future';
	readonly header?: string;
	readonly updates?: readonly UpdateSectionItem[];
	readonly text?: string;
}

export interface UpdateSectionItem {
	readonly category:
		| 'general'
		| 'replays'
		| 'achievements'
		| 'duels'
		| 'arena'
		| 'decktracker'
		| 'battlegrounds'
		| 'mercenaries'
		| 'profile'
		| 'collection';
	readonly details: UpdateSectionItemDetails[];
}

export interface UpdateSectionItemDetails {
	readonly type: 'feature' | 'bug' | 'ui' | 'content' | 'misc';
	readonly text: string;
}

export const updates: readonly Update[] = [
	{
		version: '9.8.',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		IMPORTANT: I have started to receive quite a lot of error reports about the app not loading. In many case, this was caused by the Internet Service Provider not allowing access to the https://static.zerotoheroes.com domain. If you're facing issues with the app, please check out <a href="https://github.com/Zero-to-Heroes/firestone/wiki/FAQ---Troubleshooting" target="_blank">the FAQ</a> for some debugging tips.
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Add a "Buckets" tab that lets you browse the contents of all available buckets.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add a basic deckbuilder for constructed. It's still an early version, so please let me know what other features you'd like to see in there :).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the bonus from Amulet of Undying would disappear when dredged.`,
							},
						],
					},
				],
			},
			{
				type: 'minor',
				header: 'Minor updates',
				updates: [
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Add an option to show the available tribes instead of the banned tribes. Also add a few additional display options for that widget.`,
							},
							{
								type: 'bug',
								text: `Fix an issue in the simulator where the minion tooltip would stick around after dragging the minion around.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add a way to delete decks directly from the "Decks" page, without having to go into each deck individually.`,
							},
							{
								type: 'feature',
								text: `Update the cost of the card dredged by Excavation Specialist in the tracker.`,
							},
							{
								type: 'feature',
								text: `Add a (temporary) icon for countered cards. The icon for now is the same as the "burned" cards, and will be replaced by a proper icon once Jasmin (the awesome designer who makes Firestone look so good) comes back from vacation.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where a card that was previously at the Top or Bottom of deck would appear again in that zone after going back to the deck from your hand.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the opponent's hero power damage counter (to keep track of Mordresh) wouldn't disappear if the opponent revealed themselves as Rogue after starting as Mage.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where battlecry minion played from an effect (e.g. summoned by Dirty Rat) would still show up in the Global Effect zone.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where dredged cards that went back to the deck would still keep their "dredge" icon.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the "top of deck" card from the opponent's deck would not disappear after them drawing the card. This typically happened when they dredged a card that had an effect on Dredge, like Tople the Idol.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Add a way to delete decks directly from the "Decks" page.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the "use high-resolution cards" settings was ignored for card tooltips are related cards.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'future',
			// 	header: 'Under the Hood',
			// 	text: `
			// 		This release
			// 	`,
			// },
		],
	},
];
