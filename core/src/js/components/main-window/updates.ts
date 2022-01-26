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
		version: '8.6.3',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		I just wanted to let you know that you're awesome. Keep it up!
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
								type: 'content',
								text: `Update app for patch 22.2. More details below :)`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `The simulator now supports the new Buddies. The abililty to add them to custom boards will be added soon.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Add support for Vanndar and Drek'Thar. In the Hero tab, they appear as different hero for each allied class.`,
							},
							{
								type: 'misc',
								text: `Duel stats are now only loaded for the specific Time and MMR filters you've selected. This means that the initial load should be faster, and they will take less space in memory. The downside is that when you change these, you might have a small delay until the stats are reloaded.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add an option (turned on by default) to show the order in which minions on board came into play. This can be particularly useful if you're trying to figure out the order in which deathrattles will trigger for instance.`,
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
								text: `Fix an issue where sometimes no minion would appear in the Simulator search results after entering a search term.`,
							},
							{
								type: 'ui',
								text: `Improve the display of the hero selection tooltip. It now is smaller and aligned with the game's own tooltip.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add card highlights for Alliance Bannerman.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `The Hero filter now lets you select a specific hero instead of a class.`,
							},
							{
								type: 'feature',
								text: `The Hero / Hero power / Signature treasure filters now don't show options that are incompatible with other choices (e.g. if you select Mindrender Illucia as a hero, it won't show you Rattlegore's Signature Traasures).`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where some tasks (especially Story ones) would not be in the proper order.`,
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
