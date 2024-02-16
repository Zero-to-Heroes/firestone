export interface Update {
	readonly sections: readonly UpdateSection[];
	readonly force: boolean;
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
		version: '13.5.1',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `If you ever wonder what the total play time for each mode looks like for ALL of Firestone users, I have published an infographics on Twitter: https://x.com/ZerotoHeroes_HS/status/1726691418687832090?s=20
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `You can now browse the stats for the Quests and Rewards in the app.`,
							},
							{
								type: 'feature',
								text: `View the Quest/Reward stats directly in the overlay! This shows the reward's average placement and the quest's average turns to complete. This is a premium feature, but free users can still use it a couple of times a day (the exact quantity can still change in the future)`,
							},
							{
								type: 'bug',
								text: `I forgot to add the setting to disable the quest overlay in 13.5.0, it should now be available under Settings > Battlegrounds > Overlay. Sorry about that!`,
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
								type: 'bug',
								text: `Fix an issue where the Earthen Golem counter wouldn't appear anymore.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue where the Stable Amalgamation reward would be treated as Avenge (1).`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where the effects that summons a minion "when there space" for them would not work as intended.`,
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
