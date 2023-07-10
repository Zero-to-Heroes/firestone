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
		version: '11.5.9',
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
								type: 'misc',
								text: `I have updated the visual design for the lottery widget. It looks much better now, and the information is easier to see`,
							},
							{
								type: 'content',
								text: `The app is now updated for 26.6.2`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where many cards were missing the "gift" icon in the opponent's hand.`,
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
								text: `Fix an issue where the current equipped weapon's durability was not taken into account when computing total damage on board (this is only relevant when the hero has Windfury).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Symphony of Sins token were not tracked properly (the logs do some pretty unusual stuff for these).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Commander Sivara would not remember the quests that you played.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the tracker would get lost when the opponent dredges from our deck (with Disarming Elemental or Spy-o-Matic).`,
							},
							{
								type: 'content',
								text: `Add several oracles and card highlights, and fix a few existing ones (Hope of Quel'Delar, Rewind, Doomerang, Flesh Behemoth).`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the total dust cost for high-wins decks was incorrect.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `(Premium) Premium users can now rescale the lottery / achievements tracker widget to make it smaller.`,
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
