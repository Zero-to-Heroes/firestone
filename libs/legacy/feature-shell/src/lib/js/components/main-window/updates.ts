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
		version: '13.11.15',
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
								text: `The Azerite Rat will now show you all candidate minions as related cards when mousing over it in the tracker.`,
							},
							{
								type: 'feature',
								text: `Endgame will now show you the last demon that died as related cards when mousing over it in the tracker.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the "pirates summoned" counter would not appear.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `The battle odds simulator should now better take into account the opponent's and player's teammates, especially when only one board of the battle was seen. This is still not perfect, and this specific case will probably not be manageable in a fully accurate way, but it should reduce the amount of times an easy win (according to the sim) would be in fact a crushing loss to a single opposing warband.`,
							},
							{
								type: 'content',
								text: `Increased the range for the minions list widget size, as sometimes even the smaller setting could still be a bit big.`,
							},
							{
								type: 'bug',
								text: `(Premium) Fix an issue where the face-offs recap table would not properly update when facing heroes with special skins.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Darkmoon Prizes would appear in the minions list.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where mousing over a portrait in Duos could sometimes give you the board of their teammate.`,
							},
							{
								type: 'bug',
								text: `Fix many issues with the battle odds simulator. It is still not to its pre-patch level of accuracy, but it's in a decent place now.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Left-clicking on the app's icon in the system tray now brings up the app's main window.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the twitch extension could stop receiving updates upon relogging in.`,
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
