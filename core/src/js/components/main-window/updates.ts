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
		version: '9.5.18',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		Hello everyone! I'm just back from vacation with my family, so the pace of updates should pick up again. This first release fixes quite a few bugs and adds some missing features for the 23.0 Hearthstone release.
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a simulation issue with Leeroy not properly handling indirect damage (like bombs from Kaboom Bot).`,
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
								text: `Fix an issue where the order of players in the HP Graph's legend was reversed.`,
							},
							{
								type: 'bug',
								text: `Fix an issue when selecting some golden minions in the simulator.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add card oracle (flag cards in opponent's hand) for Nellie's Ship.`,
							},
							{
								type: 'feature',
								text: `Add card oracle for quest rewards.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where Commander Sivara's oracle would show minions instead of spells.`,
							},
							{
								type: 'bug',
								text: `Fix buggy filter for "Top 500 Legend".`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Frozen minions would sometimes be counted in the total attack on board.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where you couldn't import a deck when spectating a friend.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Add missing buckets in Deckbuilder.`,
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
