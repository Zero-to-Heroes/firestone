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
		version: '12.2.1',
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
								type: 'feature',
								text: `(PREMIUM) You can now view card-level stats for each deck. This will tell you, for a given decklist, the Mulligan winrate, drawn winrate and kept percentage for each card in the deck.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where cards created in deck would not be properly detected anymore.`,
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
								type: 'bug',
								text: `Remove Death Knight and Demon Hunter as valid classes for Twist and Classic in the deckbuilder.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where stats on the hero selection overlay would not show up anymore.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the MMR filter in the hero selection phase would always consider the top 1% of players instead of your own MMR.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Cards created by Elixir of Vigor should now have their cost be set to 2 in the deck.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where ties would not be detected properly and cause runs to be split.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the classes filters would not work properly on the Buckets screen.`,
							},
							{
								type: 'content',
								text: `The card classes will now appear at the top of each bucket when browsing them in the Buckets or Deckbuilding tabs.`,
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
