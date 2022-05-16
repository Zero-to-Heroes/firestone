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
		version: '9.5.15',
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
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where sometimes the app would stop tracking the game.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add an option to not reset the "Top of Deck" and "Bottom of Deck" sections after trading a Tradeable card.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where sometimes the Coin was not detected in the opponent's hand.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `The buckets (in the Deckbuilder) now show the offering rates of each card in it.`,
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
								text: `Fix an issue where Orgozoa was being incorrectly attached to Quilboars.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Perfect Games were not flagged as "Perfect" in the replays tab.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add card highlight for Deepwater Evoker.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where resurrected minions would disappear from the Other zone.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where secrets countered by Improved Ice Trap would still cause the secrets helper to show.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Grey Sage Parrot's widget would show the first spell cast instead of the last one.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Charge minions were not being taken into account in the total attack widget.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Improve deck code import / export overall. There are still some limitations caused by HS itself though (neutral Vanndar / Drek'Thar and the League of Explorers heroes).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the hero filter would not apply to your "draft decks" (the ones you created with the deckbuilder that don't have any run yet).`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Add missing treasures synergies highlights.`,
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
