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
		version: '13.21.8',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `This release aims at adding as many features for the new Perils in Paradise expansions ahead of its official launch. Since they have been added while the cards themselves are not playable, please keep in mind that some of these might be a little buggy, so please leet me know if you encounter something that doesn't work as it should. <br/>
			// 	And many more goodies will come once I'm finally able to play with the cards and see how some of these actually work :)
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
								text: `Fix an issue where the mulligan winrate would sometimes be incorrect in the overlay.`,
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
								type: 'bug',
								text: `Fix an issue where Zilliax' cost would be set back to 0 when putting it back into your deck.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some cards would show up as "Unknown cards" even if you had enabled the setting to turn that off.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Restore the ability to export a battle to the simulator, so that you can modify it there.`,
							},
							{
								type: 'feature',
								text: `Restore the "End of Turn" and "Taunt" groups in the minions list.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the tooltip of a minion would not update correctly when modifying it in the simulator.`,
							},
							{
								type: 'bug',
								text: `Continue fixing simulation issues.`,
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
