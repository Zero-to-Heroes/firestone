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
		version: '12.5.5',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `It's giveaway time! I will soon announce a couple of giveaways on Twitter, so make sure to follow me there if you want to participate: https://twitter.com/ZerotoHeroes_HS
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
			// 					type: 'bug',
			// 					text: `Fix an issue where the tracker would get stuck if the app was started while a game was already in progress.`,
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
								text: `Add an Excavate counter.`,
							},
							{
								type: 'bug',
								text: `Try to improve handling of disconnects.`,
							},
							{
								type: 'bug',
								text: `Fix an issue when spectating two players at the same time (Community Report!).`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a couple of simulation issues with Diremuck Forager (Community Report!).`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'ui',
								text: `The look and feel for the quick deck select when starting a Duels has been streamlined.`,
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
