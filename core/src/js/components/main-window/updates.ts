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
		version: '9.3.0',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		I'm aware of the "memory reading" messages getting spammed for some of you. I'm currently working on fine-turning how sensitive memory resets need to be, but it might still take a couple of iterations to get it right. In the meantime, please don't hesitate to open bug reports, it helps me have a better picture of the problem.
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Add a few missing languages in the Localization dropdown in the Settings.`,
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
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Improve tiers for Treasures so that they're not all S tier :)`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Add counters for Southsea Strongarm and Majordomo Executus.`,
							},
							{
								type: 'feature',
								text: `Add an option to sort the heroes by their tier (global winrate) in the Heroes tab.`,
							},
							{
								type: 'bug',
								text: `Prevent an info leak where the opponent heroes were sent to the extension before they were revealed in the UI.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the heroes' warband stats could have some impossible values for the early turns.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add basic support for Blademaster Okani.`,
							},
							{
								type: 'feature',
								text: `Add card oracle for Runaway Gyrocopter and Plague of Murlocs (for the Tombs of Terror adventure).`,
							},
							{
								type: 'feature',
								text: `Add card highlight for Jr. and Sr. Tomb Diver (Tombs of Terror) and Scrap Shoot (Hunter).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the "show stats separately" option was not working in the single-zone display. You should now be able to see these multiple Amulets of Undying with their correct stat boosts directly in the tracker.`,
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
