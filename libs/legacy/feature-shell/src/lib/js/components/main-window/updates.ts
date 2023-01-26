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
		version: '10.1.9',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `Thank you all for using Firestone. It means a lot to me that so many of you use something that I made. I wish you a very happy new year.`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'general',
			// 			details: [
			// 				{
			// 					type: 'content',
			// 					text: `App has been fully updated for patch 25.2. I'm still looking for a way to properly support Professor Putricide creations in the simulator, so stay tuned. Enjoy the new patch :)`,
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
								type: 'feature',
								text: `Add counter for Magmaloc.`,
							},
							{
								type: 'content',
								text: `Remove buddies from the simulator minions list.`,
							},
							{
								type: 'bug',
								text: `Try to fix an issue where your new MMR can be empty when you finish 1st or 2nd.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with aura minions (like Cyborg Drake, Southsea Captain, etc.).`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue when Putricide's creation had Reborn.`,
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
