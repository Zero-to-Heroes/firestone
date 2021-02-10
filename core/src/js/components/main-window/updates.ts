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
		version: '7.2.7',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		Finally some improvements to the in-game overlay in Battlegrounds! Now you don't need multiple monitors to take advantage of many of the BG features :)
			// 		<br/>
			// 		And I'm looking to rework the app's home page (at https://www.firestoneapp.com/) to better showcase everything the app can do. If you or someone you know are available for the job, please let me know (on Discord)!
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
					// {
					// 	category: 'achievements',
					// 	details: [
					// 		// {
					// 		// 	type: 'feature',
					// 		// 	text: `(ALPHA) A second-screen window can be activated for non-BG matches that shows you the current progress on each achievements, and highlighting the achievements that have progressed during the current match.`,
					// 		// },
					// 	],
					// },
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a bug where the tavern upgrades for opponents would sometimes not be detected.`,
							},
							// {
							// 	type: 'feature',
							// 	text: `(ALPHA) You can now enable highlighting of minions that match specific tribes in the tavern.`,
							// },
						],
					},
					// {
					// 	category: 'decktracker',
					// 	details: [],
					// },
					// {
					// 	category: 'general',
					// 	details: [],
					// },
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
								text: `Add an option to hide the hero selection screen.`,
							},
							{
								type: 'feature',
								text: `Add options to hide the battle simulation during the combat phase, and show it in the Tavern.`,
							},
							{
								type: 'ui',
								text: `Increase the fond size for minions stats.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where sometimes the simulation sample link would not open.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where disabling the second-screen app would also disable the battle simulation.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where the minions tier list could not be moved around.`,
							},
							{
								type: 'bug',
								text: `Fix a small bug in the simulator with minions that involve their neighbours, when the dead minions is at the far right of the board.`,
							},
							{
								type: 'bug',
								text: `Fix a small bug in the simulator with Greybough's hero power and reborn minions.`,
							},
						],
					},
					// {
					// 	category: 'collection',
					// 	details: [],
					// },
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix AI decklists not loading.`,
							},
							// {
							// 	type: 'ui',
							// 	text: `(ALPHA) Add archetype id below the deck name when viewing deck details.`,
							// },
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Add text filter for heroes / hero powers / signature treasures.`,
							},
							{
								type: 'misc',
								text: `Improve performance when navigating through the various tabs.`,
							},
						],
					},
					{
						category: 'achievements',
						details: [
							{
								type: 'bug',
								text: `Fix a bug where clearing the round 3 in Monster Hunt would grant all achievements for MH. Also adds a similar fix for the other solo adventures.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'ui',
								text: `Stop scaling elements when going full-screen. This rework will be an ongoing effort throughout the next releases.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where the loading window would not appear anymore.`,
							},
						],
					},
				],
			},
			{
				type: 'future',
				header: 'What is next',
				text: `
					Finally some improvements to the in-game overlay in Battlegrounds! Now you don't need multiple monitors to take advantage of many of the BG features :)
					<br/>
					And I'm looking to rework the app's home page (at https://www.firestoneapp.com/) to better showcase everything the app can do. If you or someone you know are available for the job, please let me know (on Discord)!
					<br/>
					<br/>
					Stay safe,
					<br/>
					Seb.
				`,
			},
		],
	},
];
