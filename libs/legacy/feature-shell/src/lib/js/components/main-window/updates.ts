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
		version: '13.11.25',
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
			// 					type: 'misc',
			// 					text: `The app has been updated for patch 29.2, and basic support for Duos (simulator and replays) has been added. I'm still working on some improvements, so expect updates in the coming days.`,
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
								text: `The Dragons Summoned counter now shows up for the opponent when they're playing Druid (it used to show up only for Priest).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where card traded back in your opponent deck would sometimes incorrectly increment their count in deck (mostly when importing a decklist for your opponent).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Secrets Helper would not show the list of secrets when created by certain cards (e.g. Desperate Measures, Oh My Yogg).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Zilliax would appear as a 0-cost card in the meta decks lists.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the mulligan helper would not show any data for Zilliax.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Whizbang decks would not be properly imported for the opponent.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where selecting multiple decks in the Constructed tab would only show stats for the first selected deck.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `You can now browse the Duos leaderboards from the Battlegrounds section. The MMR of your opponent displayed in the lobby (if activated) now use this new Duos leaderboard.`,
							},
							{
								type: 'bug',
								text: `Fix (again) some issues with Duos. A previous update accidentally overwrote some of the fixes that were made for Duos, and this update should restore them.`,
							},
							{
								type: 'bug',
								text: `Fix multiple simulation issues.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'bug',
								text: `Top 4 now shows up as a loss in Duos.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix the behavior of the "back" button.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where clicking on a card to see the details would sometimes not show anything.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where card sound effects had disappeared.`,
							},
							{
								type: 'bug',
								text: `(Premium) Fix an issue where collection stats would always show the info for the whole collection, instead of matching the selected sets (mostly Standard / Wild).`,
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
