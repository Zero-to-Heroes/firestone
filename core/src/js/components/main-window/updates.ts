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
		version: '8.0.0',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					This release mostly prepares the app for the upcoming Mercenaries release on October 12th to keep things as smooth as possible when the mode goes live. However, this hasn't been tested against real data, so please open bug reports when you encounter weird things. And most of all, enjoy your Mercenaries time!
				`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `A very first Mercenaries tab has been created! You can see all available mercs & abilities, and stats (global + yours) will start appearing there soon after the official launch on October, 12th.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'misc',
								text: `The app has been updated to try and properly record Mercenary game results when the new game out is out. Just keep in mind that this couldn't be tested against real data, so it's possible that bugs will arise at launch.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'minor',
			// 	header: 'Minor updates',
			// 	updates: [
			// 	],
			// },
			// {
			// 	type: 'future',
			// 	header: 'Under the Hood',
			// 	text: `

			// 	`,
			// },
		],
	},
];
