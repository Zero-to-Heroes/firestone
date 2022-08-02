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
		version: '9.8.20',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		IMPORTANT: In the future, decks you play with might be shared (anonymously) with the community if they perform well at a high rank. If you don't want others to find out about your secret decklists (I think that can especially be true for high-level Legend players), please turn off the new "Allow game sharing" option under Settings > General.
			// 	`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'achievements',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `Add an option to completely turn off all achievements system. WARNING: this option is ON by default, so if you want to use achievements please make sure to turn it off first.`,
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
								text: `Add card highlight for Clockwork Assistant.`,
							},
							{
								type: 'feature',
								text: `Cards created by Devouring Swarm, Selective Breeder and Jackpot now show a gift icon in hand.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the winrate stats would sometimes be slightly off.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Prince Renathal would not appear in the Global Effects section.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix card highlight for Band of Bees.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Add missing treasures synergies highlights for before 24.0 (it will take a few days to gather enough data for the new treasures).`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `All the missing sounds are now available in the app. When playing sounds, the app now properly cycles between the different variations (if there are multiple flavors).`,
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
