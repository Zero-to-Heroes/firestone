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
		version: '7.0.2',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		This new update finally gives me a way to talk to you more directly and inform you in-app of all the new stuff that comes with each new release. So please find below all the main updates, and if you're interested you can even dig deeper into the smaller items.
			// 		<br/>
			// 		And of course, feel free to reach out to me directly either on Discord or by submitting a bug/feedback (links are on the top bar above).
			// 		<br/>
			// 		<br/>

			// 		And finally, I would like to thank you for using Firestone. It's thanks to you that the app can get where it is today, so thank you from the bottom of my heart.
			// 		<br/>
			// 		<br/>
			// 		Take care,
			// 		<br/>
			// 		Seb.
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
								type: 'feature',
								text: `The new HS in-game (native) achievements can now be browsed inside Firestone. Also, a pop-up appears when a new native achievement is completed telling you what the achievement is about.`,
							},
							// {
							// 	type: 'feature',
							// 	text: `(ALPHA) A second-screen window can be activated for non-BG matches that shows you the current progress on each achievements, and highlighting the achievements that have progressed during the current match.`,
							// },
						],
					},
					// {
					// 	category: 'battlegrounds',
					// 	details: [
					// 		{
					// 			type: 'feature',
					// 			text: `You can now enable the "view replay example" in the battle simulation overlay. It opens the simulation example in a new browser tab, so the option is disabled by default.`,
					// 		},
					// 		{
					// 			type: 'feature',
					// 			text: `(ALPHA) You can now see the last known opponent's board (as well as other pieces of data) when mousing over the opponent's avatar in the leaderboard.`,
					// 		},
					// 		{
					// 			type: 'feature',
					// 			text: `(ALPHA) You can now show the list of all minions, grouped by tavern tier.`,
					// 		},
					// 		{
					// 			type: 'feature',
					// 			text: `(ALPHA) You can now enable highlighting of minions that match specific tribes in the tavern.`,
					// 		},
					// 	],
					// },
					{
						category: 'general',
						details: [
							// {
							// 	type: 'feature',
							// 	text: `Added a button to directly share the current screen to Reddit (for now only on the Battlegrounds pages).`,
							// },
							{
								type: 'feature',
								text: `App has been updated with 19.4 content (images might take a few days to come up though).`,
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
								text: `Tavern level icons and minion tooltips now use the original image, so they should look better :)`,
							},
							// {
							// 	type: 'ui',
							// 	text: `(ALPHA) Add an icon to identify last round's opponent.`,
							// },
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'ui',
								text: `(ALPHA) Add archetype id below the deck name when viewing deck details.`,
							},
						],
					},
				],
			},
		],
	},
];
