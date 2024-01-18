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
		version: '13.2.22',
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
						category: 'replays',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the cards would not appear properly, especially the ones in the player's hand.`,
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
							{
								type: 'bug',
								text: `Fix a sim issue where the first minion to attack would not be recomputed after Teron's Rapid Reanmation trigger.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Scallywag's Sky Pirate token would not attack right away, but wait for enemy reborn to trigger first.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Emergent Flame would never target enemy minions.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Obsidian Ravager would not deal damage to its main target in its pre-attack phase.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where non-golden Withered Spearhide would give 2 Blood Gems`,
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
