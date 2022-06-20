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
		version: '9.8.5',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		IMPORTANT: I have started to receive quite a lot of error reports about the app not loading. In many case, this was caused by the Internet Service Provider not allowing access to the https://static.zerotoheroes.com domain. If you're facing issues with the app, please check out <a href="https://github.com/Zero-to-Heroes/firestone/wiki/FAQ---Troubleshooting" target="_blank">the FAQ</a> for some debugging tips.
			// 	`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'duels',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `Add a "Buckets" tab that lets you browse the contents of all available buckets.`,
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
								type: 'bug',
								text: `Fix a sim issue where Wildfire Element would cause deathrattles and reborn effects to happen first for the main target, then the collateral damage (while in the game all minions die at the same time).`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where reborn deathrattle minions would spawn left of their deathrattles, instead of right.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where deathrattle with single targets (Impulsive Trickster, Selfless Hero, etc.) could target dead or dying minions.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Tamsin's Hero Power would only target 4 minions.`,
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
