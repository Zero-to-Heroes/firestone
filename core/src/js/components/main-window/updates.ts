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
		version: '9.4.9',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					Hello everyone! I'm just back from vacation with my family, so the pace of updates should pick up again. This first release fixes quite a few bugs and adds some missing features for the 23.0 Hearthstone release.
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
								text: `Add support for Dredge and for cards at the bottom of the deck.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where spectating friends would make the matches count towards your own stats.`,
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
								text: `Fix a simulation issue where Sefin could grant poisonous to an already poisonous minion.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue where Witching Nestmatron was considered Avenge (4).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the simulation warnings would not be displayed anymore (these appear when the board contains some unsupported compositions or minions, typically Piloted Whirl-O-Tron or Secrets).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Aranna's upgrading her hero power would trick the app into believing that she also had upgraded her buddy.`,
							},
							{
								type: 'bug',
								text: `Fix the counter value for Southsea Strongarm and Majordomo Executus.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Properly tracks Full-Blown Evil copies in the opponent's hand.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the app would sometimes not detect a deck change when playing some adventures against the AI.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where having two repeatable cards in hand would cause the number of cards in hand to be incorrectly displayed.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix some deck codes not being properly copied. This is not fully retroactive, so expect some bugs for decks created before this update (and it won't fix the Neutral Vanndar and Drek'Thar deck codes, as these are not yet supported by HS itself)`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Fix some instances of the mercenaries info not updating.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix the "best pack for set" stat sometimes taking into account a Standard pack.`,
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
