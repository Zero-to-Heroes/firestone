export interface Update {
	readonly sections: readonly UpdateSection[];
	readonly version: string;
}

export interface UpdateSection {
	readonly type: 'intro' | 'main' | 'minor' | 'beta';
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
		| 'decktracker'
		| 'battlegrounds'
		| 'collection';
	readonly details: UpdateSectionItemDetails[];
}

export interface UpdateSectionItemDetails {
	readonly type: 'feature' | 'bug' | 'ui' | 'content';
	readonly text: string;
}

export const updates: readonly Update[] = [
	{
		version: '7.1.0',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					A mini-update for Hearthstone patch 19.4, with a few small goodies tucked in. 
					<br/>
					<br/>
					Enjoy the new patch!
					<br/>
					Seb.
				`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'achievements',
						details: [
							{
								type: 'feature',
								text: `The new HS in-game (native) achievements can now be browsed inside Firestone. Also, a pop-up appears when a new native achievement is completed telling you what the achievement is about (except for Battlegrounds, for some reason yet unknown).`,
							},
							// {
							// 	type: 'feature',
							// 	text: `(ALPHA) A second-screen window can be activated for non-BG matches that shows you the current progress on each achievements, and highlighting the achievements that have progressed during the current match.`,
							// },
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `You now have a small icon next to the last opponent you fought (useful for Murozond for instance).`,
							},
							// {
							// 	type: 'feature',
							// 	text: `You can now enable the "view replay example" in the battle simulation overlay. It opens the simulation example in a new browser tab, so the option is disabled by default.`,
							// },
							// {
							// 	type: 'feature',
							// 	text: `(ALPHA) You can now see the last known opponent's board (as well as other pieces of data) when mousing over the opponent's avatar in the leaderboard.`,
							// },
							// {
							// 	type: 'feature',
							// 	text: `(ALPHA) You can now show the list of all minions, grouped by tavern tier.`,
							// },
							// {
							// 	type: 'feature',
							// 	text: `(ALPHA) You can now enable highlighting of minions that match specific tribes in the tavern.`,
							// },
						],
					},
					{
						category: 'general',
						details: [
							// {
							// 	type: 'feature',
							// 	text: `Added a button to directly share the current screen to Reddit (for now only on the Battlegrounds pages).`,
							// },
							{
								type: 'feature',
								text: `The app has been updated with 19.4 content. The card images might take a few days to come up.`,
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
								type: 'ui',
								text: `The tavern level icons and minion tooltips now use the original image, so they should look better :)`,
							},
							// {
							// 	type: 'ui',
							// 	text: `(ALPHA) Add an icon to identify last round's opponent.`,
							// },
						],
					},
					// {
					// 	category: 'decktracker',
					// 	details: [
					// 		{
					// 			type: 'ui',
					// 			text: `(ALPHA) Add archetype id below the deck name when viewing deck details.`,
					// 		},
					// 	],
					// },
				],
			},
		],
	},
];
