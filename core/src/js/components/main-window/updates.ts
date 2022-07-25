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
		version: '9.8.19',
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
					{
						category: 'decktracker',
						details: [
							{
								type: 'ui',
								text: `The card images that are displayed in the deck tracker should now more accurately mirror what you see in the in-game deck builder, which should make cards more recognizable.`,
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
							{
								type: 'ui',
								text: `Increase the size of replay entries in the Perfect Games tab.`,
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
							{
								type: 'feature',
								text: `Add card highlight for Shroud of Concealment.`,
							},
							{
								type: 'feature',
								text: `Add Frost Lich Jaina to global effects.`,
							},
							{
								type: 'bug',
								text: `Fix a couple of issues when playing Lady Prestor with interactions like Dredge and Sir Finley. There are still some issues lingering (from what I've seen, playing Finley with discounted dragons in hand messes things up), and I'll look into them in the next release.`,
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
							{
								type: 'misc',
								text: `On a related topic, there are now buttons in the settings to force the refresh of some pieces of data that are cached for several days. You will typically never need these, but might want to force a refresh after switching computers if you run Firestone on multiple machines.`,
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
