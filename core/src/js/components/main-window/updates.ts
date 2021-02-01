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
	readonly type: 'feature' | 'bug' | 'ui' | 'content' | 'misc';
	readonly text: string;
}

export const updates: readonly Update[] = [
	{
		version: '7.2.3',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					Finally some improvements to the in-game overlay in Battlegrounds! Now you don't need multiple monitors to take advantage of many of the BG features :) 
					<br/>
					And I'm looking to rework the app's home page (at https://www.firestoneapp.com/) to better showcase everything the app can do. If you or someone you know are available for the job, please let me know (on Discord)!
					<br/>
					<br/>
					Stay safe,
					<br/>
					Seb.
				`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					// {
					// 	category: 'achievements',
					// 	details: [
					// 		// {
					// 		// 	type: 'feature',
					// 		// 	text: `(ALPHA) A second-screen window can be activated for non-BG matches that shows you the current progress on each achievements, and highlighting the achievements that have progressed during the current match.`,
					// 		// },
					// 	],
					// },
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `You now have a small icon next to the last opponent you fought (useful for Murozond for instance).`,
							},
							{
								type: 'feature',
								text: `You can now enable the "view replay example" in the battle simulation overlay. It opens the simulation example in a new browser tab, so the option is disabled by default.`,
							},
							{
								type: 'feature',
								text: `You can now see the last known opponent's board (as well as other pieces of data) when mousing over the opponent's avatar in the leaderboard.`,
							},
							{
								type: 'feature',
								text: `You can now show the list of all minions, grouped by tavern tier.`,
							},
							// {
							// 	type: 'feature',
							// 	text: `(ALPHA) You can now enable highlighting of minions that match specific tribes in the tavern.`,
							// },
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Add a button to directly copy the current screen to your clipboard (for now only on the Battlegrounds pages). Useful for quickly sharing your end comp on Discord :)`,
							},
							// {
							// 	type: 'feature',
							// 	text: `Added a button to directly share the current screen to Reddit (for now only on the Battlegrounds pages).`,
							// },
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
								text: `The information for the lobby's other opponents should now be more readable. On bigger screens, it will also display the timing of the last tavern upgrades.`,
							},
							{
								type: 'ui',
								text: `The ALL tribe now uses Amalgadon's image, instead of Zapp's.`,
							},
							{
								type: 'ui',
								text: `Remove the Firestone logo from the battle simulation overlay.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the winrate chart would cap at 80% in the post-match stats.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the ghost's board info would override your previous opponent's board.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the "coins wasted" stat was not properly computed anymore.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `When opening Darkmoon Races cards, the app doesn't show one notification per card anymore.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Cards drawn by Tome of Origination are now flagged in the opponent's hand.`,
							},
							{
								type: 'feature',
								text: `Add more time filter options in the Ladder screens.`,
							},
							// {
							// 	type: 'ui',
							// 	text: `(ALPHA) Add archetype id below the deck name when viewing deck details.`,
							// },
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Add a class filter for hero powers and signature treasures. Please note that dual class treasures are still not correctly handled (they only appear in one of the two classes), and that will be fixed in a later release.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'misc',
								text: `Removed a CPU spike when going into the Duels screens (before entering a match).`,
							},
							// {
							// 	type: 'ui',
							// 	text: `(ALPHA) Add archetype id below the deck name when viewing deck details.`,
							// },
						],
					},
				],
			},
		],
	},
];
