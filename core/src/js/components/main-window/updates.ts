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
		version: '9.8.16',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		IMPORTANT: In the future, decks you play with might be shared (anonymously) with the community if they perform well at a high rank. If you don't want others to find out about your secret decklists (I think that can especially be true for high-level Legend players), please turn off the new "Allow game sharing" option under Settings > General.
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'achievements',
						details: [
							{
								type: 'feature',
								text: `Add an option to completely turn off all achievements system. WARNING: this option is ON by default, so if you want to use achievements please make sure to turn it off first.`,
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
								text: `Fix a simulation issue where Fish of N'Zoth would remember the deathrattles in reverse order.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue where Baron Rivendare's effect would not be applied if it died to a cleave effect.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue where Bru'kan's hero power would always trigger after Illidan.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue where Yrel would only buff +1 health.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add Card Oracle for Ice Trap.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'misc',
								text: `I've started working on some optimization on when remote data is loaded into the app. It should make the initial app load a bit quicker, and will reduce the memory footprint of the app if you only play a few modes. This is a work in progress and will likely be spread over multiple releases, so don't expect drastic big-bang improvements :)`,
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
