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
		version: '10.1.3',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `Thank you all for using Firestone. It means a lot to me that so many of you use something that I made. I wish you a very happy new year.`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'general',
						details: [
							{
								type: 'content',
								text: `App has been fully updated for patch 25.2. I'm still looking for a way to properly support Professor Putricide creations in the simulator, so stay tuned. Enjoy the new patch :)`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'minor',
			// 	header: 'Minor updates',
			// 	updates: [
			// 		{
			// 			category: 'decktracker',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `Improve detection of copied cards in the opponent's hands. Spells copied by Lady Deathwhisper will now be properly identified after the original has been played (and similar improvement for Elementary Reaction).`,
			// 				},
			// 				{
			// 					type: 'feature',
			// 					text: `Flag the card transformed in the opponent's hand by Plaguespreader's effect.`,
			// 				},
			// 				{
			// 					type: 'feature',
			// 					text: `The "show gifts separately" option now puts gifts at the very bottom of the deck when using the Legacy display mode .`,
			// 				},
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an issue where Patchwerk would not delete the card in the deck.`,
			// 				},
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an incorrect highlight for Bonecaller.`,
			// 				},
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an info leak when playing From De Other Side.`,
			// 				},
			// 			],
			// 		},
			// 		{
			// 			category: 'battlegrounds',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `Games that end before any hero is selected will not count towards stats anymore. When you concede a game this early, HS chooses a hero for you to get 8th place with, which distorts statistics. If this change bothers you (and you'd like an option to revert it), please ping me on Discord.`,
			// 				},
			// 				{
			// 					type: 'bug',
			// 					text: `Fix a sim issue where Fish of N"Zoth would not remember other Fish deathrattles.`,
			// 				},
			// 			],
			// 		},
			// 		{
			// 			category: 'general',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `The "Flash HS window when it's your turn" will now also flash the window when the game is over.`,
			// 				},
			// 			],
			// 		},
			// 	],
			// },
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
