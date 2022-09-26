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
		version: '9.12.0',
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
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `When playing Murloc Holmes, he now tells you if he saw one of the offered cards in your opponent's starting hand.`,
							},
							{
								type: 'feature',
								text: `Mousing over a card when Discovering now highlights the related cards in your deck.`,
							},
							{
								type: 'feature',
								text: `There is now an option to hide the opponent's tracker when opening the friends list.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Add an option to show the hero tier and average position directly on the hero selection screen. This is disabled by default, so you need to enable it from the Settings > Battlegrounds if you want to use it.`,
							},
							{
								type: 'feature',
								text: `There is now an option to hide the session widget when opening the friends list.`,
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
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Add an option to sort the personal decks by average wins.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where sometimes no high-wins decks were propersed after choosing the hero power for Vanndar and Drek'Thar.`,
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
