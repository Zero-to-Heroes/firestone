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
		version: '9.3.7',
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
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the signature treasure would not disappear even when moving the mouse away from the selection.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Trying to fix an issue where the app would sometimes lag behind the game state by quite a bit. This has required a rewrite of an important part of the app, so please let me know if you experience some strange behaiors.`,
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
								type: 'feature',
								text: `Now display the current rating on the session widget after a reset.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Properly identify cards in deck created by Dreadlich Tamsin's hero power.`,
							},
							{
								type: 'feature',
								text: `Add card highlight for Vectus.`,
							},
							{
								type: 'ui',
								text: `Stop widgets from flickering when they are first created.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Add a secondary icon to neutral heroes on the stats screen so that you can identify which class they are more easily.`,
							},
							{
								type: 'feature',
								text: `Add an option to deactivate stats on mouseover during a run preparation.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the "archive deck" button would not do anything.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where no stats overlay would appear when no stats are available.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some dual class signature treasures would not have any associated stats.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Add a few missing speed buff modifiers.`,
							},
							{
								type: 'ui',
								text: `Show buff influence as negative values when mousing over a speed modifier in a battle.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Improved the performance of screens where huge list of things are displayed (like the cards list screen). Displaying a list of BG matches still remains quite resource intensive though and still feels a bit a bit laggy, and I'm still working on it.`,
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
