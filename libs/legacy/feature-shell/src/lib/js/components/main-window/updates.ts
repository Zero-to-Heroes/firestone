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
		version: '11.2.18',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `The last patch has been more bumpy than I expected. If you find that the app doesn't track your games properly, please first try restarting Hearthstone, and see if the problem persists. Thanks again for your patience and support!`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'general',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `(PREMIUM) Premium users now have a Profile Page online (see mine at https://www.firestoneapp.gg/profile/daedin). For now it only includes a collection overview, but I will add more things in the coming weeks. Let me know what you would like to see there!`,
			// 				},
			// 			],
			// 		},
			// 	],
			// },
			{
				type: 'minor',
				header: 'Minor updates',
				updates: [
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `The Corpse Counter can now be displayed if the opponent is a Deathknight that played one of each runes.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Vengeful Spirit would highlight deathrattles from weapons in the deck.`,
							},
							{
								type: 'content',
								text: `Add card highlights for Mass Resurrection, Totemic Might and Totemic Surge.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'ui',
								text: `Fix the font on the session recap widget (for some reason it was set to the default Times New Roman).`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'content',
								text: `Don't show the pity timers for Merc packs.`,
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
