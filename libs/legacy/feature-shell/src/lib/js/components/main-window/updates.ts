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
		version: '13.6.0',
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
			// 			category: 'battlegrounds',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `Quest stats overlay is back! While it's a premium feature, free users can use it for two games every day (this might change in the future).`,
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
								text: `Premium users can now move directly over cards in their hand to highlight related cards in the deck tracker (non-premium users can still do this by mousing over the cards in hand in the tracker itself).`,
							},
							{
								type: 'feature',
								text: `Unknown Mixed Concoctions in the opponent's hand are now flagged! As this card is a custom card (thanks Matt!), it is not localized and will always be in English for now.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Energy Shaper would leak some information about what card in the opponent's hand were spells.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Counterspell cards' effect would not be properly accounted for when graying out some secrets in the secrets helper.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue where Rapid Reanimation's target would not always be correct.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Weebomination's battlecry was not implemented.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Warband Stats chart would not properly display numbers greater than 1000.`,
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
