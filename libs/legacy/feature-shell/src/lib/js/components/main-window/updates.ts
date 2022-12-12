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
		version: '10.0.17',
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
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Add a fix for the "legacy" display mode (the one where you don't have the deck/hand/other zones), which was sometimes doing weird things (especially when discarding cards).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where cards discarded from the opponent's hand would not be properly removed from their hand tracker.`,
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
								text: `Fix the winrate / warband charts sometimes not being displayed properly, as well as their tooltips sometimes missing information.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix stat tooltips when choosing your hero, now that there are 6 heroes to choose from.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where a rating of 0 would not be displayed at all in the Runs recap. Also tries to improve rank detection when aggregating matches into runs.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where hitting the "back" arrow while navigating the app would sometimes not properly update the screen's main title.`,
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
