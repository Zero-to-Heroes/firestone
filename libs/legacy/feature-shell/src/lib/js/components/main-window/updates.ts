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
		version: '12.0.7',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `There have been many small versions released during the past couple of weeks, without proper release notes. This is a summary of the changes that have been made since the last proper release notes.`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'decktracker',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `Deck meta stats are here! You can now see detailed stats for decks to pick whatever will work best for you on the ladder. This is still an early version, so expect some bugs and missing features.
			// 					There are still many things planned for the near future (some of these features will be available to premium users only):
			// 					<ul>
			// 						<li>Additional filters (let me know which ones you need!)</li>
			// 						<li>Archetype stats</li>
			// 						<li>Detailed matchup stats</li>
			// 						<li>Detailed card stats</li>
			// 					</ul>
			// 					Also, a big thanks to https://www.d0nkey.top for sharing their archetype categorization with us!
			// 					`,
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
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add a "limited" option to most of the counters, that only shows up the counter on the most likely cases you want to see it. Use this option if you feel like you're seeing the counters too often when you don't need them.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Treant counter would not count the Treants summoned by Drum Circle.`,
							},
							{
								type: 'content',
								text: `Add more oracles, mostly for the new Standard Anomalies and a couple of Duels treasures.`,
							},
							{
								type: 'ui',
								text: `Due to popular demand, the "Yogg" counter now has a different icon reflecting the cards in your deck.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue where Tough Tusk would not get divine shield when a blood gem is played on it.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Warpwing would lose its shield after attacking .`,
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
