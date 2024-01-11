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
		version: '13.2.16',
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
			// 					type: 'bug',
			// 					text: `Reconnects should be handled more gracefully now. It is still a tricky subject, so let me know if you experience bugs after reconnecting to your game.`,
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
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Show cards in hand and secrets in BG simulation replays.`,
							},
							{
								type: 'feature',
								text: `Show minion overlay icons (deathrattle, trigger, poisonous, etc.) on BG simulation replays.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with the location of spawned minions.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with buffing the minions in the opponent's hand.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Reckoning.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Audacious Anchor start of combat behavior.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where minions from a higher tavern tier could still be summoned during combat.`,
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
