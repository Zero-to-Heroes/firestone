export interface Update {
	readonly sections: readonly UpdateSection[];
	readonly force: boolean;
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
		version: '13.8.0',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `IMPORTANT: some people have reported app crashes since the latest updates. The reports for now have all been on Battlegrounds, so I'm disabling the new Quests live stats for now. Please let me know if this improves the situation for you (you can reach out on Discord: https://discord.gg/vKeB3gnKTy or by using the "Report a bug" feature at the top right of the app's main window).
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'arena',
						details: [
							{
								type: 'feature',
								text: `The Cards Stats tab now have more stats than ever! You can browse the Deck Winrate and Mulligan Winrate for each card.`,
							},
							{
								type: 'feature',
								text: `(Premium) The Draft overlay now also shows the Deck Winrate in addition to the Drawn Winrate and Pick rate stats.`,
							},
							{
								type: 'feature',
								text: `Synergies are now highlighted when mousing over cards in a deck list or draft picks. This works both for your own decks, and the ones from the High-Wins Decks tab.`,
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
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `The opponent's decklist will now be hidden until the mulligan is over, so as to limit info leaks caused by Whizbang decks.`,
							},
							{
								type: 'feature',
								text: `Add a "Dragons Summoned" counter for Zarimi.`,
							},
							{
								type: 'feature',
								text: `Add a "Cards Drawn" counter for Playhouse Giant.`,
							},
							{
								type: 'feature',
								text: `Add a "Turns left before death" counter for Wheel of DEATH!!!`,
							},
							{
								type: 'feature',
								text: `Add a counter to keep track of (1)-cost cards played for Thirsty Drifter.`,
							},
							{
								type: 'content',
								text: `When playing as/against Whizbang, the deck card now appears in the Global Effects section, as a reminder of what your deck is about.`,
							},
							{
								type: 'bug',
								text: `The tracker should now show the correct cost for Zilliax.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where resizing the mulligan overlay would not work very well.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Fizzle's Snapshots would be grouped in a single line in your hand, thus preventing you from accessing the contents of each snapshot.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Zilliax would not be removed from your tracker when drawn or destroyed.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Loaner decks would not be properly detected.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the Lord of Gains counter would count normal and golden versions of Spellcrafts as two different spells.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue with Matador.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue with Flourishing Frostling.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'feature',
								text: `The Deck Score now uses the Deck Winrate of each card, instead of the Drawn Winrate.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where resizing the mulligan overlay would not work very well.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Class card packs don't have a guaranteed legendary in the first 10 packs, and the pity timers have been updated to reflect that.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'ui',
								text: `Show the name of the last patch (e.g. 29.0.1) instead of simply "Last Patch" in the time filters.`,
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
