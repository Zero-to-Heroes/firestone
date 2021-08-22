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
		version: '7.14.0',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		This release adds lots of Quality of Life improvements, which are one of my favorite things to do. I hope you'll enjoy it :)
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
								text: `New filters are available to dig deeper into the stats. You can now filter things by MMR percentile, by Hero Power, or Signature Treasure. Please be aware though that certain filter combinations don't have a lot of data, so the results can be unreliable in these cases.`,
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
								type: 'bug',
								text: `Fix a bug where poisonous minions would still give their targets a chance to revive through deathrattle buffs like Goldrinn's.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where quickly starting a new game after the first could cause the tracker to bug out in the new lobby.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix a bug where the "last patch" filter doesn't work since 21.0.3`,
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
