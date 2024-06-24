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
		version: '13.17.1',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `IMPORTANT: some people have reported app crashes since the latest updates. The reports for now have all been on Battlegrounds, so I'm disabling the new Quests live stats for now. Please let me know if this improves the situation for you (you can reach out on Discord: https://discord.gg/vKeB3gnKTy or by using the "Report a bug" feature at the top right of the app's main window).
			// 	`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'general',
			// 			details: [
			// 				{
			// 					type: 'content',
			// 					text: `Firestone has been updated for patch 29.6.`,
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
								text: `Activating the Streamer Mode in Firestone now hides the opponent's name in the decktracker.`,
							},
							{
								type: 'content',
								text: `Add many oracles and card highlights. These are usually not written in the release notes anymore, but I just wanted to mention it so you know that these are continually being improved on :)`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some cards created in deck would not be flagged as gifts when drawn by the opponent.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the mana cost of cards transformed in hand (like Shifter Zerus) would not be properly updated.`,
							},
							{
								type: 'ui',
								text: `Move the format info of the mulligan deck overview (standard/wild/twist) to a second line to reduce the horizontal space taken by the widget.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `There is now an option to always show Tier 7 minions in the minions list.`,
							},
							{
								type: 'ui',
								text: `The minion stats should now appear on top of the overlays (like Divine Shield, Stealth, etc.) when viewing replays so that they are clearly visible at all times.`,
							},
							{
								type: 'bug',
								text: `Fix many simulation issues. I still expect a few releases over the week to get to pre-patch level of accuracy, but the odds should be decently reliable at the moment. Note: one of difficulties with having full accuracy is that Hearthstone itself has a few bugs; so the simulation can be accurate, but the game itself can still be wrong, which results in incorrect odds.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some buddies would not appear in the buddies list.`,
							},
							{
								type: 'bug',
								text: `(Premium) Fix some live stats being incorrectly computed while in game ("coins wasted" and "enemy heroes killed" mainly).`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the count of Diamond / Signature cards would not appear when browsing the collection.`,
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
