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
		version: '13.2.6',
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
			// 					type: 'feature',
			// 					text: `You can now update your current Discord status message when playing Hearthstone with Firestone enabled. See <a href="https://github.com/Zero-to-Heroes/firestone/wiki/Firestone-features#general">the wiki</a> for some screenshots.`,
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
								type: 'bug',
								text: `Fix an issue where the "Forged" icon in the opponent's hand would sometimes get very big.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'misc',
								text: `Update for 29.2.3.`,
							},
							{
								type: 'feature',
								text: `Add support for secrets in the simulator.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with the attack order when tokens are summoned.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Tamsin's Hero Power not properly updating the first attacker.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Ozumat's Hero Power not triggering at the right time.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Mechanized Gift Horse.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where auras where not properly reapplied after minion stats were set to a specific value.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where minion deaths were not always properly processed after a Start of Combat hero power.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'misc',
								text: `Drastically improve the performances when browsing replays.`,
							},
							{
								type: 'feature',
								text: `Add support for Tavern Spells (in play and in hand).`,
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
