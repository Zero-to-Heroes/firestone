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
		version: '8.0.29',
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
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Add the possibility to manually move forward / backward in the "Current task" report of the Progression tab, using Ctrl + click or Alt + click.`,
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
								text: `Mousing over the current speed in the team widget will now show you which abilities cause the speed buff / debuff.`,
							},
							{
								type: 'feature',
								text: `Team widget can now be displayed on the team building and bounty selection screens (useful to see the current tasks).`,
							},
							{
								type: 'feature',
								text: `Add settings to resize the team widgets.`,
							},
							{
								type: 'feature',
								text: `Add a search bar in the progression tab. You can search for any hero/ability/equipment name or text.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the task list would get truncated when the team widget was too small.`,
							},
							{
								type: 'ui',
								text: `Make the mercs on the bench even dimmer, as they were too easily mistaken with the active heroes.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a simulator issue where Tony Two-Tusks would not grant additional stats to the transformed minion.`,
							},
							{
								type: 'ui',
								text: `Hide heroes tier if it is empty (like the tier S currently).`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'feature',
								text: `Replays against human opponents should now show their real name instead of UNKNOWN HUMAN OPPONENT.`,
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
