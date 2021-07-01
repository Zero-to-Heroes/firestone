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
		| 'decktracker'
		| 'battlegrounds'
		| 'collection';
	readonly details: UpdateSectionItemDetails[];
}

export interface UpdateSectionItemDetails {
	readonly type: 'feature' | 'bug' | 'ui' | 'content' | 'misc';
	readonly text: string;
}

export const updates: readonly Update[] = [
	{
		version: '7.10.9',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		This release has some moderate logging enabled to try and help me debug some issues that seem to arise randomly: Reckoning being greyed out inappropriately, and the tavern timing turn in BG being off by 1 in the future. <br/>
			// 		So if you encounter one of these issues, by all mean please open a bug report! :) <br/>
			// 		You might therefore face some lags (mostly in BG), but overall I think things should be fine. <br/>
			// 		<br/>
			// 		Have fun, and thanks again for all the help :)
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
								type: 'feature',
								text: `Mousing over a card in your decklist will now highlight related cards in your deck. For instance, mousing over a card that draws a Mech from your deck will highlight all the Mechs in your deck.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where the deck would not be properly detected when playing a friend with the same deck several times in a row.`,
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
								text: `Fix an issue where the simulator would sometimes not show up when fighting the ghost.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the simulation results would not show up in the tavern.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where no new Battle (in the Battles tab) would appear when facing the same opponent twice in a row.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the golden minions would not have a golden border in the Battles tab.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where no tooltip would appear when mousing over minions on the Battles tab.`,
							},
							{
								type: 'ui',
								text: `Improve the initial state of the Battles (before we receive the board information).`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Cards info are now kept after playing Secret Passage. This means that when the opponent gets their card backs, all the known information should be displayed once more.`,
							},
							{
								type: 'feature',
								text: `Flag the exact cards drawn by Ysera.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where end-of-season card rewards would not appear in the card history.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'future',
			// 	header: 'Under the Hood',
			// 	text: `

			// 	`,
			// },
		],
	},
];
