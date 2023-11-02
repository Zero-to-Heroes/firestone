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
		version: '12.4.17',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `This release for now mostly contains technical updates. I'm trying to make the app load faster, and decrease the memory it uses overall, especially if you're only using one or two modes. It will take a while to get there, so expect the improvements to be very gradual. </br>
			// 	This first phase focuses on making the app load faster when on desktop (i.e. HS is not running).
			// 	`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'duels',
			// 			details: [
			// 				{
			// 					type: 'bug',
			// 					text: `Try and fix an issue where the run ID in duels was not always consistent across games of the same run, which messed up with the "high-wins decks" detection. IMPORTANT: the first game started after updating the app to 12.4.13 (or later) will be in a new run. Sorry about the inconvenience.`,
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
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the lottery widget wouldn't show any information anymore. The points were still being collected, just not shown in the UI.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where some meta deck details would not be updated (the "overview" part would still be ok).`,
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
