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
		version: '11.8.1',
		force: false,
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `I'm continuing to update the app to accomodate all the changes of latest 27.2 patch. These are mostly bug fixes and behind-the-scenes improvements, but may also contains a couple of quality of life features :)`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the simulator would ignore most triggered abilities.`,
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
								type: 'feature',
								text: `Add a way to filter hero stats based on the Anomaly. It's still experimental, and the sample size is probably still too small, so take the results with a grain of salt.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Evil Twin (the quest reward) would not cause the first attacker to be recomputed.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the "Ooops, All ____" anomay would cause the banned tribes widget to display a single tribe with a banned icon.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the app would get lost when all players would be Sire Denathrius.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'content',
								text: `Add card highlights and oracles for the new Caverns of Time cards.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where long card names would not be displayed nicely in the card seach dropdown.`,
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
