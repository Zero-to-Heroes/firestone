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
		version: '11.6.3',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `The last patch has been more bumpy than I expected. If you find that the app doesn't track your games properly, please first try restarting Hearthstone, and see if the problem persists. Thanks again for your patience and support!`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix a display issue where damage done with spells would not be properly shown, although the data was correctly computed.`,
							},
						],
					},
					// {
					// 	category: 'battlegrounds',
					// 	details: [
					// 		{
					// 			type: 'feature',
					// 			text: `(PREMIUM) You can now see stats for quests and rewards in the overlay. This features shows you the average turn to complete a given quest, based on the quest difficulty, your hero and your MMR range, and shows the average final rank for players who picked this quest for your MMR range.<br/> A proper "Quests" tab will be availble soon to all users in the app, where you will be able to get a detailed view on all these stats.`,
					// 		},
					// 	],
					// },
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
								type: 'feature',
								text: `Add a counter for Astral Automaton. More counters and oracles will be coming in the following weeks, but I will wait for the extension to be available in friendly matches to make testing easier.`,
							},
							{
								type: 'feature',
								text: `Add a spell school counter when facing Mage opponents.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Plagues would not be removed from the opponent's deck when drawn.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where ALL minions were not counted in the Elemental counter.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix the simulator for the updated behavior of golden Bristleback Knight.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Illidan's hero power.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `If there are no top Tavern Brawls decks that you can build, you will now be offered to copy a deck for which you have missing copies, with a warning.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'misc',
								text: `Due to the mode not being actively supported anymore, the Mercs icon has now been moved down, below Duels and Arena.`,
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
