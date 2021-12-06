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
		version: '8.3.11',
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
								text: `Add some "tips" in the empty ad space when not showing ads. Often, some hidden features or new settings are mentioned in the patch notes, but then become hard to find. This section will try to highlight these to make it easier to figure out everything you can do with the app.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Add a new "Coins to Farm" column that recaps how many coins you, well, need to farm, taking into account the coins you'll get from uncompleted tasks.`,
							},
							{
								type: 'feature',
								text: `Add an option to show more details on merc teams in the Replays tab(like the benches and the player equipped items).`,
							},
							{
								type: 'ui',
								text: `The "Coins left" and "Coins needed" columns are now hidden by default, and can be displayed by making the window wider.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix broken pack history.`,
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
								type: 'feature',
								text: `Highlight minions with tribe in the graveyard when mousing over N'Zoth in the tracker.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where "reset" and "deleted" actions would be ignored when showing deck stats in-game.`,
							},
							{
								type: 'ui',
								text: `The "number of copies" for each card will now always be the righmost element, so that all numbers stay aligned even when some cards are gifted, burned, dead, and so on.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the HP graph would show incorrect values for heroes with armor.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where clicking on a meta PvP team would bring you to another empty screen and sometime freeze the app.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where PvP teams in replays were sometimes not displayed until an app reboot.`,
							},
							{
								type: 'ui',
								text: `Order the tasks in the tasks list according to the merc order in collection, to make it easier to build your team for task farming.`,
							},
							{
								type: 'ui',
								text: `Hide global stats that have too few matches (the cutoff is at 50 for now).`,
							},
							{
								type: 'ui',
								text: `Manually force some equipments to display tier 4 when they can't be upgraded.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'ui',
								text: `Fix missing image for Alterac Valley packs.`,
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
