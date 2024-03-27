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
		version: '13.8.2',
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
			// 			category: 'arena',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `The Cards Stats tab now have more stats than ever! You can browse the Deck Winrate and Mulligan Winrate for each card.`,
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
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `You can now enable an option to show your opponent's MMR directly in the overlay. WARNING: this uses a name lookup on the official leaderboards to get the information. As such, it is not 100% reliable, especially at the "lower" MMR (< 8000).`,
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
