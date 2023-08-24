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
		version: '11.8.2',
		force: false,
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `I'm continuing to update the app to accomodate all the changes of latest 27.2 patch. These are mostly bug fixes and behind-the-scenes improvements, but may also contains a couple of quality of life features :)`,
			},
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'battlegrounds',
			// 			details: [
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an issue where the simulator would ignore most triggered abilities.`,
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
								type: 'bug',
								text: `Fix an issue where Plagues would not be tracked properly after consecutive draws with Helya.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'content',
								text: `Add simulator support for Murky.`,
							},
							{
								type: 'content',
								text: `Remove the "unsupported composition" message when Rylak is on board (it's fully supported now).`,
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
