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
		version: '12.1.2',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `There have been many small versions released during the past couple of weeks, without proper release notes. This is a summary of the changes that have been made since the last proper release notes.`,
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
								text: `There is a bug where some decklists in the constructed meta decks use Wild cards instead of the standard legal ones. I have fixed this recently, but it will take a few days for the new games to use the updated decklists. The data has also been cleaned of the corrupted lists, so there will be a gap in data for the next few days. Sorry for the inconvenience!`,
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
								text: `Add a "limited" option to most of the counters, that only shows up the counter on the most likely cases you want to see it. Use this option if you feel like you're seeing the counters too often when you don't need them.`,
							},
							{
								type: 'feature',
								text: `Add a Chaotic Tendrils counter.`,
							},
							{
								type: 'feature',
								text: `Add a Secrets Played counter.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Fizzle's Snapshot info would disappear after drawing it.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Treant counter would not count some Treants.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Plague + Helya parser would break if another "cast when drawn" card was revealed between two Plagues.`,
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
								text: `Fix an issue where the MMR filter would not work anymore.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Tough Tusk would not get divine shield when a blood gem is played on it.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Warpwing would lose its shield after attacking .`,
							},
							{
								type: 'bug',
								text: `Fix an issue where corrupted data would sometimes appear in the meta hero stats.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'feature',
								text: `Now show the full anomaly card when mousing over it in the Replays section.`,
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
