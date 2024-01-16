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
		version: '13.2.20',
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
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Add an option to show the generated cards in a separate section (called "Other (gifts)") in the deck tracker.`,
							},
							{
								type: 'feature',
								text: `Add an option to show the cards on board in a separate section in the tracker.`,
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
								type: 'bug',
								text: `Fix an issue where weapons were missing a gift icon.`,
							},
							{
								type: 'content',
								text: `Mousing over Imp King Rafaam in the tracker now shows the Imps that could be resurrected as related cards.`,
							},
							{
								type: 'ui',
								text: `Remove the golden border from cards in hand in the tracker.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue when multiple secrets could trigger during the same attack.`,
							},
							{
								type: 'bug',
								text: `Fix a few sim issues where tokens would not always spawn at the right place.`,
							},
							{
								type: 'bug',
								text: `Fix another sim issue instance where tokens spawned might not attack in the right order.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where cards created by Primalfin Lookout in hand might not be murlocs.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where the first minion to attack after Illidan's Hero Power trigger might not attack again, even if still alive.`,
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
