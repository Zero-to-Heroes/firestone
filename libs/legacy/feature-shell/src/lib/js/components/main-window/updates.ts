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
		version: '11.5.12',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `The last patch has been more bumpy than I expected. If you find that the app doesn't track your games properly, please first try restarting Hearthstone, and see if the problem persists. Thanks again for your patience and support!`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'content',
								text: `The app has been updated for Quests and patch 26.6.3. Enjoy!`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'misc',
								text: `This lottery season will be a short one! Seasons are 2 week long from now on (with 2 winners for each), and should have a bit more varied tasks. I'm still working on adding new tasks, so if you have any interesting ideas, please hit me up :)`,
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
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `You can now change the opacity of the Lottery widget (apart from the ad space, which is always at 100%). Go to Settings > General > Lottery and change the opacity slider.`,
							},
							{
								type: 'feature',
								text: `You can now see the time left in the current season.`,
							},
						],
					},
					{
						category: 'achievements',
						details: [
							{
								type: 'feature',
								text: `Live tracking of achievements now contains the current Reward Track XP (if any), and tells you where in the achievements hierarchy you can find that achievement (which is useful for context when the name is not enough).`,
							},
							{
								type: 'feature',
								text: `The "Pick for Me" feature now excludes Collection and Progression achievements, and prioritizes achievements that grand Rewards Track XP.`,
							},
							{
								type: 'feature',
								text: `The current progress of achievements is now displayed when browsing achievements in Firestone, and is updated after each game.`,
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
