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
		| 'decktracker'
		| 'battlegrounds'
		| 'collection';
	readonly details: UpdateSectionItemDetails[];
}

export interface UpdateSectionItemDetails {
	readonly type: 'feature' | 'bug' | 'ui' | 'content' | 'misc';
	readonly text: string;
}

export const updates: readonly Update[] = [
	{
		version: '7.3.0',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		Beta version is back!
			// 		<br/>
			// 		<br/>
			// 		Stay safe,
			// 		<br/>
			// 		Seb.
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'achievements',
						details: [
							{
								type: 'feature',
								text: `(ALPHA) A second-screen window can be activated for non-BG matches that shows you the current progress on each achievements, and highlighting the achievements that have progressed during the current match.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `(BETA) Stats are now computed live! There are still a few things to fix and polish, but I've been really enjoying it :)`,
							},
							{
								type: 'feature',
								text: `(ALPHA) You can now enable highlighting of minions that match specific tribes in the tavern.`,
							},
							{
								type: 'feature',
								text: `For premium supporters: I have totally removed the ad space in the in-game window to give more space to the stats.`,
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
								text: `Add an in-game button to show / hide the battlegrounds window, so you don't have to use any keyboard shortcut anymore. The button is only available if you have the "integrated mode" option toggled on, as I'm assuming you don't need it if you have multiple monitors. Let me know if I'm wrong!`,
							},
							{
								type: 'feature',
								text: `Add an option to display the opponent's board tooltip at the bottom of the screen.`,
							},
							{
								type: 'feature',
								text: `Add controls to modify the size of the opponent's board tooltip.`,
							},
							{
								type: 'bug',
								text: `Fix a broken tooltip display when mousing over the heroes in the hero selection screen.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'ui',
								text: `(ALPHA) Add archetype id below the deck name when viewing deck details.`,
							},
							{
								type: 'ui',
								text: `Add a button in the settings to reset the tracker's position, which can be useful if for some reason it is not visible anymore.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'future',
			// 	header: 'What is next',
			// 	text: `
			// 		A few features are on my plate today.
			// 		<br/>
			// 		<br/>
			// 		Stay safe,
			// 		<br/>
			// 		Seb.
			// 	`,
			// },
		],
	},
];
