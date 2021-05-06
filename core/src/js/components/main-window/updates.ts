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
		version: '7.8.19',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		You may have
			// 		<br/>
			// 		<br/>
			// 		This updates mostly brings small-ish Quality of Life improvements. I'll probably have another couples of small update following over the next months to fix / improve existing features, so if you have any feedback or ideas, please don't hesitate to send them to me!
			// 		<br/>
			// 		<br/>
			// 		Take care,
			// 		<br/>
			// 		Seb.
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
								text: `Fix an issue where Avenge would be ruled out if the only other minion on board was dormant.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the simulator would incorrectly handle Murloc Warleader's and Southsea Captain's auras.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the initial deck of a run would not be properly detected on non-English HS clients.`,
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
								type: 'feature',
								text: `Add a Total row in the deck's stat matrix.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the decklist would be lost after restarting a fight in some solo adventures.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some standard decks would be incorrectly classified as Wild if you played a game in Wild.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the confirmation popup when closing the decklist would not have any text.`,
							},
							{
								type: 'ui',
								text: `Zoom in on the images used for counters so that white spaces stop showing at the sides.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Show cards/treasure picks when viewing a personal deck.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix some sounds being incorrectly labelled for the hero portraits.`,
							},
							{
								type: 'ui',
								text: `Group hero portraits by class.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the completed achievements would not show up for Ragnaros at the hero selection stage.`,
							},
							{
								type: 'ui',
								text: `Show up an "unsupported composition" when at least one secret is in play, to properly reflect the fact that the simulator doesn't handle them yet.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'future',
			// 	header: "What's next",
			// 	text: `
			// 		A few features are on alpha / beta testing phase today:
			// 		<br/>
			// 		<ul>
			// 			<li>(Battlegrounds) A way to highlight specific minions or tribes in the tavern.</li>
			// 			<li>(Constructed) A way to guess the opponent's archetype from the card they have played, and the ability to override their decklist with a popular list from that archetype.</li>
			// 			<li>A way to track the current progress you're making towards achievements while in a match.
			// 		</ul>
			// 		<br/>
			// 		If you are interested in helping me test and polish these, feel free to ping me on Discord :)
			// 		<br/>
			// 		<br/>
			// 		Stay safe,
			// 		<br/>
			// 		Seb.
			// 	`,
			// },
		],
	},
];
