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
		version: '7.15.2',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		This release adds lots of Quality of Life improvements, which are one of my favorite things to do. I hope you'll enjoy it :)
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
								text: `A full battle simulator is now available in the Battlegrounds tab! You can build any boards you like, and have them face each other. You can even build theoretically impossible comps, like a Divine Shield / Poisonous Ghoul (well, at least that one used to be impossible before Shudderwock).`,
							},
							{
								type: 'feature',
								text: `The full battle simulator is also available in the Battles tab on the in-game BG window. You can, as before, resimulate past battles, but now you can even tweak various attributes like the minions stats, in addition to their positioning.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the Hero and Treasure stats would be empty until you select a rank filter.`,
							},
							{
								type: 'bug',
								text: `Fix an issue when filtering for the latest patch.`,
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
								text: `Fix an issue where Prophet of the Boar would appear in the tier list even without Quilboars in the game.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Omega Buster would cause the simulator to not display any battle odds.`,
							},
							{
								type: 'bug',
								text: `Try to fix an issue where sometimes the opponent's last board would not disappear when mousing out of their portrait in the live leaderboard.`,
							},
							{
								type: 'bug',
								text: `Fix a simulator issue with Leapfrogger.`,
							},
							{
								type: 'bug',
								text: `Fix a simulator issue with Old Murk-Eye.`,
							},
							{
								type: 'bug',
								text: `Fix a simulator issue where 'whenever' spawns would not trigger some spawn effects like Deflecto Bot.`,
							},
							{
								type: 'bug',
								text: `Fix a simulator issue where tokens would spawn left of their origin, instead of right.`,
							},
							{
								type: 'bug',
								text: `Fix a simulator where the minion created by Embrace Your Rage would not be counted in the board size to decide the first player.`,
							},
							{
								type: 'bug',
								text: `Fix a simulator issue where lethal chances would sometimes be of 0 despite average damage being greater than the opponent's health.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix the search bar on the Heroes and Treasures tabs.`,
							},
							{
								type: 'bug',
								text: `Fix the position of the tooltip when mousing over cards in the tier lists on the Heroes and Treasures tabs.`,
							},
						],
					},
					{
						category: 'achievements',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where achievements could be granted while spectating.`,
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
