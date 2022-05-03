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
		version: '9.5.1',
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
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `First (very basic) iteration of the deckbuilder. For now it only has the bare minimum, and I'll need your feedback to decide what exactly to add to it :)`,
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
								text: `Add card highlights for Witching Hour and Frizz Kindleroost.`,
							},
							{
								type: 'feature',
								text: `Card highlight for Abyssal Depths now only impacts your two lowest-cost minions.`,
							},
							{
								type: 'feature',
								text: `Now tracks the cards in deck revealed by the Joust mechanic (i.e. "reveal a card in each deck", that was introduced in TGT).`,
							},
							{
								type: 'feature',
								text: `Add "bottom of deck" support for From the Depths, Sir Finley Sea Guide, Bootstrap Sunkeneer, Phasing Portal and Forgotten Depths`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the player minion summoned by an enemy Dirty Rat would be treated as a played card (and mess up with some features like the Brilliant Macaw counter)`,
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
