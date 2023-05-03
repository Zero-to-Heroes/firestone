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
		version: '11.1.8',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `Firestone is now operational once again! There's still some work needed to support all the new content from 26.2, and that will arrive in the coming days. But the app is now usable again, and you can track your games, see your stats, and use the deck tracker in all game modes. Thanks for your patience!`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'general',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `(PREMIUM) The firestoneapp.gg website has been updated with momre Duels stats and filters. The Battlegrounds section now shows which tribes have the best impact on each hero's average position.`,
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
								type: 'bug',
								text: `Fix an issue where decks with ETC Band Manager would sometimes not track properly.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where discarded cards were grouped with cards on board in the Other zone.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the turn counter would give incorrect results when going second.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Sort the strategy tips to put the most recent (so hopefully the most relevant ones) first.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Venomous minions not being registered as Venomous if they were part of the initial board.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where the cards in hand were not properly taken into account.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Flourishing Frostling and Scourfin were not implemented.`,
							},
							{
								type: 'bug',
								text: `Fix an issue the simulator would sometime not return anything.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the "Buddies" tier was shown in the minions list even when Buddies were not in the game.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the turn counter would start getting out of sync when mercenaries abilities made you choose multiple mercs from your hand in a row (like Eudora + Brightwing).`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where signature cards would not always appear in the deck list.`,
							},
							{
								type: 'bug',
								text: `Improve detection of the total wins/losses of a run when some games are not tracked by the app.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `(Beta version only): Mods are once again operational. However, I've noticed that the game regularly crashes when all mods are enabled, so I suspect that at least one of them is causing this. If you experience crashes, please disable all mods and re-enable them one by one to find the culprit, and let me know on Discord so that I can fix it. Thanks!`,
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
