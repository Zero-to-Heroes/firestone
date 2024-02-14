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
		version: '13.4.12',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `If you ever wonder what the total play time for each mode looks like for ALL of Firestone users, I have published an infographics on Twitter: https://x.com/ZerotoHeroes_HS/status/1726691418687832090?s=20
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					// {
					// 	category: 'decktracker',
					// 	details: [
					// 		{
					// 			type: 'feature',
					// 			text: `You can now view mulligan data for your deck directly in the overlay! Free users will be able to use this feature 3 times per day, while premium users will have unlimited access to it. Let me know if you have any feedback on this! (note: it will probably be deactivated when the app goes live, as I want to keep it a bit longer in beta for testing)`,
					// 		},
					// 	],
					// }
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `App has been update for 28.6. Expect some more updates throughout the week :)`,
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
								text: `Add a "spells" group next to the minion tribes in the BG minions list.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add oracles for Harth Stonebrew. After your opponent plays one of the cards received from him, the app will automatically tag all the others.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the "bottom" position in the deck was not reset when a card is being stolen.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the decklist would not be ordered by mana cost.`,
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
