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
		version: '9.9.4',
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
								type: 'bug',
								text: `Fix an issue where importing a decklist for the opponent while in game would not work properly.`,
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
								text: `Add a widget for Vanessa VanCleef which tells you which card you'll get from the combo.`,
							},
							{
								type: 'feature',
								text: `Add some missing card oracles (like Identity Theft).`,
							},
							{
								type: 'feature',
								text: `Add cards highlight for Commencement, Herald of Nature, Y'Shaarj the Defiler.`,
							},
							{
								type: 'feature',
								text: `Add +1 modifier for Sunscale Raptors created in deck.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the curse counter would not properly increment when receiving curses.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the settings for "show related cards" and "show card rarity" where reversed.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where dragging the replay time bar would drag the whole app window.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `Display the number of owned diamond copies of a card when looking at the card details (Community Contribution).`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'ui',
								text: `Add several visual enhancements, mostly when using the app in non-English (Community Contribution).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the XP notification would use the target XP of the previous level.`,
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
