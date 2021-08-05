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
		version: '7.12.10',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					This release adds lots of Quality of Life improvements, which are one of my favorite things to do. I hope you'll enjoy it :)
				`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Mousing over Barian, King of Stormwind in the decklist now highlights all Taunt / Rush / Divine Shield minions from your deck.`,
							},
							{
								type: 'feature',
								text: `Mousing over Jace Darkweaver now highlights all Fel spells played this game.`,
							},
							{
								type: 'feature',
								text: `There is now a counter for dead Elwynn Boars that appears when a Boar is played, or if you have a Boar in the deck.`,
							},
							{
								type: 'feature',
								text: `A widget now appears to remind you of the first Battlecry minion played this turn when you have Bolner Hammerbeak on board or in hand.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where playing a Questline would sometimes cause the secret helper to pop up.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where playing a Sigil would sometimes not update the opponent's hand.`,
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
								text: `(Mage) Second flame is now properly flagged in hand. Cards drawn / discovered from Sorcerer's Gambit questline steps are also flagged in hand.`,
							},
							{
								type: 'feature',
								text: `(Demon Hunter) Cost reduction buffs from the Questline now show in the opponent's hand.`,
							},
							{
								type: 'feature',
								text: `(Hunter) The exact cards drawn by Devouring Swarm and Rats of Extraordinary Size are now properly flagged in hand. Global effects for the Hunter Questline have been added as well.`,
							},
							{
								type: 'feature',
								text: `(Priest) Cards drawn by Call of the Grave and the Seek Guidance Questline are now properly flagged in hand.`,
							},
							{
								type: 'feature',
								text: `(Priest) Cards drawn by Blessed Goods and Alliance Bannerman are now properly flagged in hand. Lightborn Cariel has been added as a Global Effect when played.`,
							},
							{
								type: 'feature',
								text: `(Rogue) All cards drawn by the various Spy Gizmos are now properly flagged in hand, as well as the Coins from Loan Shark and the draw from Sketchy Information.`,
							},
							{
								type: 'feature',
								text: `(Shaman) Stormcaller Bru'kan is now properly flagged in hand, as well as cards drawn by Investment Opportunity. Global effects have been added for Bru'kan and Granite Forgeborn.`,
							},
							{
								type: 'feature',
								text: `(Warrior) The cards drawn by Raid the docks and Harbor Scamp are now properly flagged in hand.`,
							},
							{
								type: 'feature',
								text: `(Warlock) Blightborn Tamsin now appears in the Global Effects section after being played, and it is now properly flagged in hand.`,
							},
							{
								type: 'feature',
								text: `(Neutral) Cards drawn / discovered by Deeprun Engineer, Mailbox Dancer, Pandaren Importer, Entrapped Sorceress are now properly flagged in hand.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where playing the same card multiple times (when bounced back to hand) would only add the Global Effect once.`,
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
