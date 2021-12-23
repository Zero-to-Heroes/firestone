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
		version: '8.4.2',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		There are still some issues here and there with mercenaries (the replays don't show up immediately for instance, the replay viewer should probably be deactivated for Mercenaries games, etc.), and all of these will be fixed over the coming days. Have fun!
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
								text: `Firestone now sends anonymous match data to hearthstone-decks.net. It's always a pleasure to Work with passionate community members, and I hope that the data you all contribute to will help them build interesting snapshots of the game. In the meantime, if for any reason you don't want your anonymous game data to be shared, you can disable the sync in the settings.`,
							},
							{
								type: 'misc',
								text: `I have started work on fixing the memory leak. It has some pretty big implications for all the in-game overlays, so please let me know if anything is broken :)`,
							},
							{
								type: 'misc',
								text: `The first elements for localization are in place. If you switch the app to French (in the settings), you'll see a few strings that are now translated. There is still a huge amount of work to do to be able to translate all the strings, so this will be a long-term effort.`,
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
								text: `Add the number of total matches you played with a hero when displaying their stats on the hero selection screen.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where Fish of N'Zoth and Snake would appear in the minions list.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add card highlights for Oracle of Elune and Razormane Battleguard.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the C'Thun counter would not increment.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Don't remove completed but unclaimed tasks from the task list.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Move Black Soulstone to Pool 2 and Grimmer Patron to Pool 1.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'bug',
								text: `Fix a visual bug where Maestra games would not be displayed with the correct class until restarting the app.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the navigation was sometimes broken after changing some dropdown filters.`,
							},
							{
								type: 'bug',
								text: `Windows in integrated mode now have a taskbar entry.`,
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
