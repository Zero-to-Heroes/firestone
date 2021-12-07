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
		version: '8.3.16',
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
								type: 'content',
								text: `Update for Fractured in Alterac Valley. All cards should be flagged in hand, Tavish's secrets have their own entries in the secret tracker, and cards are highlighted appropriately in the tracker. Let me know if you see something missing!`,
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
								text: `Add an option to increase the size of the Battle Simulation widget.`,
							},
							{
								type: 'ui',
								text: `Make the red cross on banned tribes less visible.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the opponent's last known board could not be made bigger.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'ui',
								text: `Make "tips" less flashy.`,
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
