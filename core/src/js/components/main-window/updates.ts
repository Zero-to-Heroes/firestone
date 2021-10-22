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
		version: '8.0.23',
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
						category: 'achievements',
						details: [
							{
								type: 'misc',
								text: `Achievements tracking (all options) has been disabled by default to make sure they don't negatively impact the performance for users who don't care about them. If you want to track your Firestone achievements or have live notifications for Hearthstone ones, please reenable them in the options.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Show ability speeds and speed modifiers in the battle team widget.`,
							},
							{
								type: 'bug',
								text: `Fix a memory leak that would cause the app to take way too much RAM.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'feature',
								text: `Mercenaries PvE matches are now filtered out of the "All" filter for replays. To see the PvE encounters, you must now select either "Mercenaries (All)" or "Mercenaries (PvE)".`,
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
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Add more synergies highlights.`,
							},
							{
								type: 'bug',
								text: `Fix Natalie's Anathema ability not being properly accounted for in total missing cost for her full upgrade.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'future',
			// 	header: 'Under the Hood',
			// 	text: `

			// 	`,
			// },
		],
	},
];
