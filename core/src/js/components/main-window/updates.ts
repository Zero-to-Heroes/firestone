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
		version: '8.5.1',
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
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Add the ability to resimulate past battles (only for the ones your play from now on)`,
							},
							{
								type: 'feature',
								text: `Add a way to easily export / import board states in the simulator, which will let you share specific states more easily with your friends or on Twitter.`,
							},
							{
								type: 'feature',
								text: `Add a feature in the main window's BG simulator that lets you find the optimal positioning for a given board state. This is still in beta, and takes a while to compute (several minutes at least). Let me know what you think of it!`,
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
								text: `Fix some widgets not working on custom lobbies with fewer than 8 players.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Snake and Golden Fish of N'Zoth would appear in the minions list.`,
							},
							{
								type: 'ui',
								text: `Fix a display issue where the tooltip stats would not be properly positioning when mousing over a minion in the BG app.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the cost of minions in the deck would be reduced by Vanndar even if his battlecry didn't activate.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where cards revealed by a Joust would be flagged as burned. It now also flag the card as being a gift from the Joust card - not ideal, but the best I can do without adding a new processing layer (maybe in the future).`,
							},
							{
								type: 'ui',
								text: `Fix an issue where some counters' images (like Pogo's) would be too big`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where Elixir of Vigor would not properly appear in the stats following its nerf.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the "Zoom" setting would also be applied to the Settings window itself, sometimes resulting in an unusable settings window.`,
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
