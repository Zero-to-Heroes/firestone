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
		version: '13.6.5',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `IMPORTANT: some people have reported app crashes since the latest updates. The reports for now have all been on Battlegrounds, so I'm disabling the new Quests live stats for now. Please let me know if this improves the situation for you (you can reach out on Discord: https://discord.gg/vKeB3gnKTy or by using the "Report a bug" feature at the top right of the app's main window).
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where some secrets would not be grayed out properly when attacking the enemy hero.`,
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
						category: 'decktracker',
						details: [
							{
								type: 'content',
								text: `Show the Spell Schools widget where Magister Dawngrasp is in the deck.`,
							},
							{
								type: 'bug',
								text: `Add the missing Gift set (with Harth Stonebrew) to the constructed deck builder.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue where Matador's effect would not work properly with divine shield.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Embrace Your Rage and Diremuck Forager would not interact properly.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Polarizing Beatboxer would sometimes miss a few enchantments when on the opponent's board.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Felfin Navigator wouldn't do anything when triggered by Rylak.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Monstrous Macaw would not trigger the Boon of Beetles enchantment.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Fish of N'Zoth with Reborn could inherit its own deathrattle.`,
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
