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
		version: '8.3.4',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		There are still some issues here and there with mercenaries (the replays don't show up immediately for instance, the replay viewer should probably be deactivated for Mercenaries games, etc.), and all of these will be fixed over the coming days. Have fun!
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
								type: 'misc',
								text: `This version brings along a major internal refactoring that will make it possible for me to better track and improve the app's memory and CPU usage. So no immediate benefits yet, but they should come in the near future :)`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where re-drawing a card sent back to deck with Tradeable would flag the drawn card in hand in some cases.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `Reorganize the "Hero Portraits" page. It now lets you see all the usual collectible ones (for constructed), the BG skins, and the Mercenaries, as well as all heroes you face in the Book of Mercenaries.`,
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
								text: `Fix an issue where mousing over a minion would not show its golden image anymore.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where you could mouse over the leaderboard in the hero selection phase and see what other heroes had already been picked.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the net MMR for a game would sometimes not be properly computed.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where searching for mercs would return some unrelated results.`,
							},
							{
								type: 'ui',
								text: `Only show "Coins left" when the window is big enough, to improve how things looks like on smaller windows.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Flag the card drawn by Frostweave Dungeoneer.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where clicking on the "Watch replays" button from the deck page would not do anything.`,
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
