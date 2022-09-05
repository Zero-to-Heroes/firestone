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
		version: '9.9.8',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		I'm aware of a recent info leak that lets you see the card picked by your opponent after a Discover effect. I suspect that this change (in the Hearthstone logs) is not intended and will be fixed. I have contacted Blizzard to get their stance on this. If they decide not to fix it, I will then patch the app to hide the information.
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
								type: 'feature',
								text: `Add quest rewards overview in the various widgets.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Baron Rivendare was ignored when simulating deathrattles.`,
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
								text: `Fix a sim issue that ignore the Stealth attribute.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue that ignored quests after the first one (for Sire Denathrius).`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Evil Twin on an empty board.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Change the wording of the Relic counter to show the power level of the next relic (instead of the number of relics already played).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Vanessa VanCleef's counter would also consider the player's last played card.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Add highlight for Toxic Venom.`,
							},
							{
								type: 'bug',
								text: `Fix Elune's Grace speed buff being incorrectly applied to all abilities.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where passive treasures could be displayed with a speed of 0.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the One Night in Karazhan set was not at its expected chronological place in the sets list.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where you couldn't drag the scrollbar in multiselect dropdowns.`,
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
