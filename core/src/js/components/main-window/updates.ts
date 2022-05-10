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
		version: '9.5.10',
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
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `App has been updated for patch 23.2. Let me know when you encounter bugs :) Also, the card images will be a bit longer to come this time, because of some internal changes in HS itself which broke part of my pipeline.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'minor',
			// 	header: 'Minor updates',
			// 	updates: [
			// 		{
			// 			category: 'decktracker',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `Add card oracle for Commander Sivara.`,
			// 				},
			// 				{
			// 					type: 'feature',
			// 					text: `Add a counter for Grey Sage Parrot.`,
			// 				},
			// 				{
			// 					type: 'feature',
			// 					text: `Add card highlights for Witching Hour, Tess Greymane and Frizz Kindleroost.`,
			// 				},
			// 				{
			// 					type: 'feature',
			// 					text: `Card highlight for Abyssal Depths now only impacts your two lowest-cost minions.`,
			// 				},
			// 				{
			// 					type: 'feature',
			// 					text: `Now tracks the cards in deck revealed by the Joust mechanic (i.e. "reveal a card in each deck", that was introduced in TGT).`,
			// 				},
			// 				{
			// 					type: 'feature',
			// 					text: `Add "bottom of deck" support for From the Depths, Sir Finley Sea Guide, Bootstrap Sunkeneer, Phasing Portal and Forgotten Depths.`,
			// 				},
			// 				{
			// 					type: 'feature',
			// 					text: `Parrrley is now properly tracked when added to your opponent's deck.`,
			// 				},
			// 				{
			// 					type: 'feature',
			// 					text: `Lorekeeper Polkelt now resets the Bottom and Top sections of the tracker.`,
			// 				},
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an issue where the player minion summoned by an enemy Dirty Rat would be treated as a played card (and mess up with some features like the Brilliant Macaw counter).`,
			// 				},
			// 				{
			// 					type: 'bug',
			// 					text: `Card highlight for Contraband Stash now doesn't include neutral cards.`,
			// 				},
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an issue where The Coin would not appear in the Hand section of your opponent's tracker.`,
			// 				},
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an issue where the cost of Dragons in your deck would not be updated after playing Frizz Kindleroost.`,
			// 				},
			// 			],
			// 		},
			// 		{
			// 			category: 'battlegrounds',
			// 			details: [
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an issue where stats (including battle simulation, warband stats and winrate) were not updated when facing the ghost.`,
			// 				},
			// 				{
			// 					type: 'bug',
			// 					text: `Fix a sim issue about the interaction between Southsea Captain and "attack immediately" minions.`,
			// 				},
			// 				{
			// 					type: 'bug',
			// 					text: `Fix a sim issue where the alternate skins of minions (like Amalgam / Fish of N'Zoth) would not work properly.`,
			// 				},
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an issue where Aranna's health would jump back to 40 after her hero power activates.`,
			// 				},
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an issue where updating a minion in the simulator coming from the Replays tab would freeze the simulator.`,
			// 				},
			// 			],
			// 		},
			// 	],
			// },
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
