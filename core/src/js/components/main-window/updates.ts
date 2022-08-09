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
		version: '9.8.27',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		I hope you're all having fun with the new expansion! All the new cards should now be properly supported - and if not, don't hesitate to open a bug report with the icon at the top right of the app's main window :)
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix some info leaks that would flag known cards in deck when drawn by the opponent (like with Identity Thief).`,
							},
							{
								type: 'bug',
								text: `Fix info leaks with Chameleos and Madame Lazul.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the tracker would break after a Colossal minion is copied from hand (e.g. by Kobold Illusionist).`,
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
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add highlight for Kel'Thuzad the Inevitable, Jerry Rig Carpenter.`,
							},
							{
								type: 'feature',
								text: `Add related cards for each of Lady Naz'jar transformations.`,
							},
							{
								type: 'feature',
								text: `Add a time filter when viewing a deck's detailed stats.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Abyssal Curse counter would give incorrect information when receiving curses.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where cards drawn by Dreadlich Tamsin's battlecry would be incorrectly flagged as Rifts.`,
							},
							{
								type: 'ui',
								text: `Improve the display of the Opponents breakdown chart when viewing a deck details.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `FIx an issue with the new card packs not being properly detected.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `FIx an issue where the Progression screen would not display any information.`,
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
