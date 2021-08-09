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
		version: '7.12.13',
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
			// 			category: 'decktracker',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `Mousing over Varian, King of Stormwind in the decklist now highlights all Taunt / Rush / Divine Shield minions from your deck.`,
			// 				},
			// 				{
			// 					type: 'feature',
			// 					text: `Mousing over Jace Darkweaver now highlights all Fel spells played this game.`,
			// 				},
			// 				{
			// 					type: 'feature',
			// 					text: `There is now a counter for dead Elwynn Boars that appears when a Boar is played, or if you have a Boar in the deck.`,
			// 				},
			// 				{
			// 					type: 'feature',
			// 					text: `A widget now appears to remind you of the first Battlecry minion played this turn when you have Bolner Hammerbeak on board or in hand.`,
			// 				},
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an issue where playing a Questline would sometimes cause the secret helper to pop up.`,
			// 				},
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an issue where playing a Sigil would sometimes not update the opponent's hand.`,
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
								text: `Show current bonus damage for Ignite spells shuffled in the deck.`,
							},
							{
								type: 'feature',
								text: `Add support for Lady Prestor.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'content',
								text: `Add support for United in Stormwind pack.`,
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
