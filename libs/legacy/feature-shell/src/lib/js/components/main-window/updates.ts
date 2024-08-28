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
		version: '13.21.2',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `This release aims at adding as many features for the new Perils in Paradise expansions ahead of its official launch. Since they have been added while the cards themselves are not playable, please keep in mind that some of these might be a little buggy, so please leet me know if you encounter something that doesn't work as it should. <br/>
			// 	And many more goodies will come once I'm finally able to play with the cards and see how some of these actually work :)
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
								text: `You can now browse trinket stats in the main app!`,
							},
							{
								type: 'feature',
								text: `You can now see trinket stats directly in the overlay. Free users can use this 4 times per day (which is roughly 2 games), while it's unlimited for premium users.`,
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
								text: `Trinkets are now shown in the various BG widgets, like the next opponent overview (when mousing over a portrait on the leaderboard), the quick opponents view (pressing tab (Premium)) or the overall opponents view (in the BG window).`,
							},
							{
								type: 'feature',
								text: `The list of trinkets now only shows trinkets that are available based on the current lobby tribes.`,
							},
							{
								type: 'feature',
								text: `The list of trinkets now grays out trinkets that you can't be offered with your current board (e.g. some trinkets require you to have 2 minions of a given type between your board and hand), and will explain why they are grayed out. The exact rules are still being refined though, so please let me know if you see something that seems incorrect (mostly, being offered a grayed-out trinket).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where achievements for Marin were indeed showing the ones for Madam Goya.`,
							},
							{
								type: 'bug',
								text: `Continue fixing simulation issues. Expect more fixes in the coming week!`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where Tyr would only highlight Paladin cards when mousing over it in the tracker.`,
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
