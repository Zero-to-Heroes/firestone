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
		version: '11.2.20',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `The last patch has been more bumpy than I expected. If you find that the app doesn't track your games properly, please first try restarting Hearthstone, and see if the problem persists. Thanks again for your patience and support!`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `(PREMIUM) Your Profile page now contains all-time stats for BG heroes, packs and achievement information. Once all the data and look and feel is finalized on the website, I will be looking at adding the information on the app itself (with the caveat that it can only be shared from the website). You can see the current state of the page here: https://www.firestoneapp.gg/profile/daedin. Let me know what you would like to see there!`,
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
								text: `Known cards in the opponent's deck (like the ones you spy on with Identity Theft) are now used to display the correct runes when facing a Death Knight.`,
							},
							{
								type: 'feature',
								text: `Add a Lightray counter to count the number of paladin cards you have played this match.`,
							},
							{
								type: 'feature',
								text: `Molten Pick of ROCK now shows in the decklist its bonus damage, so that you can keep track of it more easily.`,
							},
							{
								type: 'content',
								text: `Add card highlights and oracles for Jade Stash (the split version of Jade Idol), Revive Pet, Hagatha's Embrace, Meek Mastery, Ghastly Gravedigger.`,
							},
							{
								type: 'bug',
								text: `Fix some issues where known cards would not be flagged correctly in the opponent's hand, and miscellaneous smaller issues that would happen when revealing some cards in the opponent's hand or deck.`,
							},
							{
								type: 'bug',
								text: `Grey Sage Parrot now properly highlights the cards costing 6 or more.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where card highlight was not working on the opponent's deck.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `The simulator now fully support Choral Mrrrglr (even when the opponent has it on their board).`,
							},
							{
								type: 'bug',
								text: `Fix a visual glitch in the simulation replays when summoning a minion with Bassgill (the issue was only visual).`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix deckbuilder not working for Diablo.`,
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
