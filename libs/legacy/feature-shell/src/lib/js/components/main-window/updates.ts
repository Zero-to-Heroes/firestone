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
		version: '10.1.6',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `Thank you all for using Firestone. It means a lot to me that so many of you use something that I made. I wish you a very happy new year.`,
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
			// 					text: `App has been fully updated for patch 25.2. I'm still looking for a way to properly support Professor Putricide creations in the simulator, so stay tuned. Enjoy the new patch :)`,
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
								text: `Add a "Reborn" minion tier in the minions list.`,
							},
							{
								type: 'feature',
								text: `You can now input the Eternal Legion (total number of Eternal Knights dead this game) and Undead Army (total undead attack bonus) buffs in the simulator.`,
							},
							{
								type: 'feature',
								text: `Putricide creations are now supported in the simulator.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue where Sinrunner Blanchy would not come back at full health.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue where Lady Deathwhisper / Jelly Belly would proc on every minion spawn, and not just on reborns.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some minions would be shown in the list even if the tribe they were attached to was banned (e.g. Nomi).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where you couldn't hide specific players in the HP chart anymore.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the warband composition chart would only show Beasts, even when no beasts where available.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where hero health and tavern tiers would not be displayed when viewing the battles recap of past games.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the app would sometimes freeze up for a short while.`,
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
