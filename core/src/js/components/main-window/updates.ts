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
		version: '9.7.2',
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
								type: 'feature',
								text: `Add keyboard controls for the simulator. The goal is the make the simulator feel lighter and snappiere to use.`,
							},
							{
								type: 'feature',
								text: `After upgrading the tavern, automatically show the minions list for that tavern tier if the list was currently being displayed.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some users would not see any hero stats at the start of the game.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Show the full card learned by Nagaling when mousing over it in the decklist (for people like me with short attention spans that quickly forgot what they chose and can't remember the card by its name).`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix a bug where hero power / signature treasure filters were not reset when changing the hero filter, which could lead to no results being shown without any clear reason why.`,
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
								text: `Add an option to restrict the stats shown at the start of the game based on the current game's MMR / available tribes. WARNING: this usually leads to very low sample sizes, so only use it if you know what you're doing :)`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Orgozoa could appear in the minions list when Nagas were banned.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Yo-Ho Ogre "attack immediately" timing could not go off between windfury attacks.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Wildfire Elemental excess damage would propagate to neighbours.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where the minion sacrificed by Tamsin's Hero Power could still be attacked on the first attack phase.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue when handling Southsea Captain dying when they had Reborn from The Lich King's hero power.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where the board's composition (for Start of Combat triggers like Red Whelps) would only be computed after Illidan's Hero Power triggered (which would cause dead minions to not be counted).`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where minions who died after being attacked by Illidan's hero power could still be attacked in the next normal attack phase.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where the turn order would get messed up after Illidan's hero power activation.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Illidan's second attacker bonus would transfer to another minion if the second attacker died before being able to attack (e.g. when killed by a Ghoul going off).`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Mousing over Kazalusan in the decklist now also highlights dragons that were played this game (in the Other zone).`,
							},
							{
								type: 'feature',
								text: `Add Card Oracle (flagging the card in the opponent's hand) for Felsoul Jailer.`,
							},
							{
								type: 'feature',
								text: `Add card highlight for Swordfish and Gorloc Ravager.`,
							},
							{
								type: 'feature',
								text: `Add decklist support for Heroic Brawliseum.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where the tracker would incorrectly remove a "Bottom of deck" card after drawing another copy from the deck.`,
							},
							{
								type: 'bug',
								text: `Fix Card Oracle for Zola the Gorgon and Bronze Herald.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Remove the Uldum Disks of Legends passive from the stats.`,
							},
							{
								type: 'bug',
								text: `Fix a deckbuilder issue where switching Signature Treasures for one of the neutral heroes would not update the available cards pool.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'bug',
								text: `Fix a bug where rewards would disappera from the Arena Runs list after completing a new run.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where some Mercs replays would not upload properly.`,
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
