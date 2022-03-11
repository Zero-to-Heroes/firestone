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
		version: '9.1.0',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		The following weeks will be focused on Duels. This release adds a couple of features and bug fixes, and more is coming. Also, if you have specific wishes for Duels support in Firestone, now is the time to ping me on Discord :)
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Mousing over the hero in the hero selection stage now shows its stats (winrate, win distribution) as well as recent high-win decks. The decks shown match your Dust filter in the app (so if you have it set to 100 dust or less, it will only show you decks that you can craft for that amount).`,
							},
							{
								type: 'feature',
								text: `Mouseover stats are also available on the Hero Power selection screen, as well as on the Signature treasure screen. Be aware though that there is less data here, so the results might be less relevant.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'minor',
			// 	header: 'Minor updates',
			// 	updates: [
			// 		{
			// 			category: 'duels',
			// 			details: [
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an issue where the selected treasure would not appear in the decklist for the first match.`,
			// 				},
			// 			],
			// 		},
			// 	],
			// },
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
