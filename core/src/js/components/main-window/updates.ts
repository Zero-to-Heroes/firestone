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
		version: '8.0.8',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					There are still some issues here and there with mercenaries (the replays don't show up immediately for instance, the replay viewer should probably be deactivated for Mercenaries games, etc.), and all of these will be fixed over the coming days. Have fun!
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
								text: `Show the list of known opponent mercenaries, as well as their abilities (shows the lvl 1 version of the ability if they haven't played it yet) and their equipment. It's still a very rought first version, but it gets the job done :)`,
							},
							{
								type: 'feature',
								text: `A very first Mercenaries tab has been created! You can see all available mercs & abilities, and stats (global + yours) will start appearing there soon.`,
							},
						],
					},
					// {
					// 	category: 'general',
					// 	details: [
					// 		{
					// 			type: 'misc',
					// 			text: `The app has been updated to try and properly record Mercenary game results when the new game out is out. Just keep in mind that this couldn't be tested against real data, so it's possible that bugs will arise at launch.`,
					// 		},
					// 	],
					// },
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
