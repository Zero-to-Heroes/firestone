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
		version: '8.5.7',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		I just wanted to let you know that you're awesome. Keep it up!
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the mercenaries page would partially break after receiving coins for any merc.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where hotkeys would stop working if Firestone was started before Hearthstone.`,
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
								type: 'bug',
								text: `Fix an issue with the leaderboard mouse over (and minions pinning) when the Windows zoom is set at > 100%.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where hero achievements would not show up when using the app in non-English.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Flag cost reduction of cards in hand caused by Runed Mithril Rod.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where cards recruited from the deck (with or without the Recruit keyword) would not have the correct rarity.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Add synergy highlight for Fireball Volley.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the tasks list would always show up at the left side of the widget, even when the widget was placed at the left side of the screen.`,
							},
							{
								type: 'ui',
								text: `Put the current level of abilities / equipments at the top of the image, instead of in the center, to try and improve the legibility. Let me know what you think :)`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where treasures and passives would not show up in run details.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix a few incorrect string labels caused by typos during the internationalization process.`,
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
