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
		version: '9.15.4',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `This release, and probably the next couple ones, will focus on bug fixes and often requested Quality of Life improvements. So nothing super exciting, but I hope you'll enjoy the updates nonetheless.`,
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
								text: `Add a system tray icon to exit / restart the app more easily.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where retiring a run would mess up the next run inside the app (it would get grouped with the retired run).`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Add new "tiers" in the minions list for Divine Shield, Taunt and End of Turn minions. These "mechanical tiers" now appear on a second line to make them more separate from the usual tiers 1-6, and each has a different color. You can of course deactivate them from the Settings if you don't like them :)`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'content',
								text: `The PvP tabs (hero stats and compositions) have been deactivated. The reason is that the sample size was too small to provide accurate data, and they were barely used at all. I will probably revisit the idea in the future to provide once again PvP players with ideas of what is working and what isn't.`,
							},
							{
								type: 'feature',
								text: `The Tasks widget now lets you create a team code based on the active Procedural quests, and your preferences set in the Settings > Mercenaries > Quests.`,
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
								text: `Fix sim issues with Volatile Venom.`,
							},
							{
								type: 'bug',
								text: `Fix sim a issue with Interrogator Whitemane.`,
							},
							{
								type: 'bug',
								text: `Fix Houndmaster not being attached to the Beast tribe.`,
							},
							{
								type: 'ui',
								text: `Add colors to the Battlecry / Deathrattle icons in the minions list to make them easier to read.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add support for dynamic related cards when using the tracker's "legacy" display mode (the one where you don't have the Deck / Hand / Other zones). This means that when mousing over some cards using that display mode, you will see relevant contextual information, like the spells that your own Commander Sivara will give you, or the spell learned by Nagaling.`,
							},
							{
								type: 'bug',
								text: `Don't prevent recreating a deleted deck if no matches were played with it.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Show related cards in the Progress tab when mousing over equipments and abilities (Community Contribution!).`,
							},
							{
								type: 'feature',
								text: `Procedural Quests now show up in the tasks widget.`,
							},
							{
								type: 'feature',
								text: `Don't display Discover abilities in the Action Queue (Community Contribution!).`,
							},
							{
								type: 'feature',
								text: `The manual tasks update feature has been removed. Since the Village now show all tasks for all mercs, the tasks shown in the app and the tasks from the game should always be in sync.`,
							},
							{
								type: 'bug',
								text: `Fix an issue with some abilities having incorrect starting cooldowns (Community Contribution!).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where sometimes the "treasure highlight" would still persist after choosing a treasure.`,
							},
							{
								type: 'ui',
								text: `Improve the display of the Action Queue (Community Contribution!).`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where new replays were not properly attached to their region until the next app restart.`,
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
