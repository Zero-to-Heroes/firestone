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
		version: '9.6.0',
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
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Mousing over cards (in the collection, Duels deckbuilder or deck tracker) now also shows "related cards", like the appendages for Colossal minions, or tokens that the card can create. You can turn this off from the settings (there are separate settings for the main app and the decktracker)`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the Hero Stats tab would be empty if all tribe filters were selected.`,
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
								text: `Fix a sim issue with Leeroy when indirect damage was dealt (like Wildfire Elemental, or combos involving Macaw like Macaw + Ghoul).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the player's order in the Live Stats' HP graph could sometimes be incorrect.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the simulator would not handle some golden minions (like Amalgam).`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Bottomfeeders created in deck now also indicate how many times their bonus has been applied.`,
							},
							{
								type: 'feature',
								text: `Add Nellie's Pirate Ship to the Card Oracle (flagging cards in your opponent's hand).`,
							},
							{
								type: 'feature',
								text: `Add Quest rewards to the Card Oracle.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Card Oracle would flag minions for Commander Sivara.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where filtering for Top 500 legend was not working.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where you couldn't import a deck code when spectating a friend.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the attack on board counter would sometimes count the attack of frozen minions.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Add the missing "Why? Why Not?" bucket to the deckbuilder.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some cards would not appear in the cards list after activating a bucket filter.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'ui',
								text: `Improve display for the Legend rank icon and text.`,
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
