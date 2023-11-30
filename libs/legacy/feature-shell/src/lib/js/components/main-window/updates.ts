export interface Update {
	readonly sections: readonly UpdateSection[];
	readonly force: boolean;
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
		version: '13.0.4',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `If you ever wonder what the total play time for each mode looks like for ALL of Firestone users, I have published an infographics on Twitter: https://x.com/ZerotoHeroes_HS/status/1726691418687832090?s=20
			// 	`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'general',
			// 			details: [
			// 				{
			// 					type: 'content',
			// 					text: `App has been updated for patch 28.0.3`,
			// 				},
			// 			],
			// 		},
			// 	],
			// },
			{
				type: 'minor',
				header: 'Minor updates',
				updates: [
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Mousing over Starlight Whelp (and Hex Lord Malacrass) in the tracker now shows your starting hand as related cards.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Azerite Vein would not be correctly greyed out from the secrets helper.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some secrets created in-game (e.g. by Reliquary Researcher) would not be correctly flagged as "gifts".`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the "card search" field would not appear when viewing the Meta Decks tab.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some deathrattle global effects (like Unlucky Powderman) would also appear when playing the card.`,
							},
							{
								type: 'ui',
								text: `The Spell School widget now shows each spell school on a separate line, to make it easier to read. Let me know what you think of the change!`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue with Flying Feathermane.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Diremuck Forager.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix cards being flagged as "new" when opening packs before opening the Collection tab in Firestone.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'ui',
								text: `Change the ads layout to put the "go premium" banner at the top.`,
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
