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
		version: '7.16.11',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		This release adds lots of Quality of Life improvements, which are one of my favorite things to do. I hope you'll enjoy it :)
			// 	`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'battlegrounds',
			// 			details: [
			// 				{
			// 					type: 'content',
			// 					text: `App has been updated for patch 21.3.`,
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
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix phantom battles for Turn 1 sometimes appearing in the Simulator tab, which also had the effect of messing the winrate graph for the first turn.`,
							},
							{
								type: 'bug',
								text: `Fix a simulator issue where Start of Combat minion effects would not properly trigger deaths and deathrattles.`,
							},
							{
								type: 'bug',
								text: `Fix a simulator issue where Reborn effects could be applied before all deathrattles had triggered.`,
							},
							{
								type: 'bug',
								text: `Fix a simulator issue where Fish of N'Zoth could trigger deathrattles of another minion that died at the same time as it.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add a hero power damage counter for Mordresh Fire Eye and Jan'alai.`,
							},
							{
								type: 'feature',
								text: `Add card highlights for the "Prime" minions.`,
							},
							{
								type: 'feature',
								text: `Flag cards drawn by Shroud of Concealment.`,
							},
							{
								type: 'feature',
								text: `Flag cards drawn by Varian, King of Stormwind.`,
							},
							{
								type: 'feature',
								text: `Flag both Encumbered Pack Mules when one is drawn.`,
							},
							{
								type: 'bug',
								text: `Fix Ooops, All Spells! not modifying the contents of the deck.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Restore the post-match XP popup.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'future',
			// 	header: 'Under the Hood',
			// 	text: `

			// 	`,
			// },
		],
	},
];
