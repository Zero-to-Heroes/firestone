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
		version: '7.3.12',
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
					// {
					// 	category: 'achievements',
					// 	details: [
					// 		{
					// 			type: 'feature',
					// 			text: `(ALPHA) A second-screen window can be activated for non-BG matches that shows you the current progress on each achievements, and highlighting the achievements that have progressed during the current match.`,
					// 		},
					// 	],
					// },
					// {
					// 	category: 'battlegrounds',
					// 	details: [
					// 		// {
					// 		// 	type: 'feature',
					// 		// 	text: `(ALPHA) You can now enable highlighting of minions that match specific tribes in the tavern.`,
					// 		// },
					// 	],
					// },
					{
						category: 'general',
						details: [
							{
								type: 'content',
								text: `The app has been updated for patch 19.6.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix a bug where the option to disable the tracker in specific game modes would not work anymore.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where the tracker would appear in BG games if you have the "don't close tracker after match ends" option enabled.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'minor',
			// 	header: 'Minor updates',
			// 	updates: [
			// 		{
			// 			category: 'decktracker',
			// 			details: [
			// 				// {
			// 				// 	type: 'ui',
			// 				// 	text: `(ALPHA) Add archetype id below the deck name when viewing deck details.`,
			// 				// },
			// 			],
			// 		},
			// 	],
			// },
			{
				type: 'future',
				header: "What's next",
				text: `
					A few features are on alpha / beta testing phase today:
					<br/>
					<ul>
						<li>(Battlegrounds) A way to highlight specific minions or tribes in the tavern.</li>
						<li>(Constructed) A way to guess the opponent's archetype from the card they have played, and the ability to override their decklist with a popular list from that archetype.</li>
						<li>A way to track the current progress you're making towards achievements while in a match.
					</ul>
					<br/>
					If you are interested in helping me test and polish these, feel free to ping me on Discord :)
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
