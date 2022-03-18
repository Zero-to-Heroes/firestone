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
		version: '9.2.2',
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
								type: 'content',
								text: `Update app for patch 22.6`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Add quick deck selection when starting a run. It lets you quickly view and copy the deck code of your last deck and a couple of recent cheap high-win decks.`,
							},
							{
								type: 'feature',
								text: `Add a filter (for the high-wins decks) to hide decks for which you don't have all the unlocks (hero power / signature weapon).`,
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
								text: `Player region has been added to the leaderboard (it might take a couple of days for the information to be filled for everyone).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the decklist would sometimes not disappear after ending a run.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where selecting a Hero Power or Signature Treasure would prevent you from selecting other heroes in the dropdown.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a simulation issue with Reno's buddy.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add an option to hide the "Unknown Card"s in the tracker.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Encumbered Pack Mule would not appear in the player's decklist if drawn during mulligan.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where mercs would not be updated (in the mercs list) until you moused over them.`,
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
