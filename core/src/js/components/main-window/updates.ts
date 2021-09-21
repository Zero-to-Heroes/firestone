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
		version: '7.16.3',
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
								type: 'content',
								text: `App has been updated for patch 21.3.`,
							},
							{
								type: 'feature',
								text: `Hero stats have been revamped to include their placement distribution, and the tribes composition has been removed.`,
							},
							{
								type: 'feature',
								text: `Show hero stats when mousing over its portrait on the hero selection screen.`,
							},
							{
								type: 'feature',
								text: `It's now possible to filter by available tribes on the Hero stats screen. Just be sure to look at the number of matches for certain combinations, as data is less reliable with fewer match samples.`,
							},
							{
								type: 'feature',
								text: `Changing the rank or time filters on the main app now updates all the displayed stats, including the heroes tier list and the stats on the hero selection screen. It updates both the global stats shown, and you own (so choosing a top 50% MMR filter only takes into account your own games that have done at this MMR).`,
							},
							{
								type: 'misc',
								text: `Improve performances of the BGS simulator. If your number of simulations was previously set below 10,000, you can consider increasing it.`,
							},
						],
					},
					{
						category: 'achievements',
						details: [
							{
								type: 'misc',
								text: `Firestone-exclusive achievements tracking is now disabled by default. If you want to continue tracking these achievements, please enable it in the Settings. The reason is that many people don't care about FS achievements, and monitoring them would take up some resources for nothing.`,
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
								text: `The rank filter has been updated to show percentiles in addition to absolute MMR.`,
							},
							{
								type: 'feature',
								text: `Add a tooltip on the hero tier list that recaps all the filters that are currently active.`,
							},
							{
								type: 'feature',
								text: `Add a start of combat and final player damage states to the simulation viewer.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Yo-Ho Ogre would not have Taunt by default when adding him in the simulator.`,
							},
							{
								type: 'bug',
								text: `Fix a simulator issue where Rat Pack deathrattle would trigger after the Leapfrogger effect.`,
							},
							{
								type: 'bug',
								text: `Fix a simulator issue where Whelp Smuggler's health buff would not be applied for Glyph Guardian.`,
							},
							{
								type: 'bug',
								text: `Fix a simulator issue where some minions (like Imp Mama or Ghastcoiler) could spawn a few golden minions.`,
							},
							{
								type: 'bug',
								text: `Fix a simulator issue where Impulsive Trickster would cause the sim to be bug out when summoned in combat (from Imp Mama for instance).`,
							},
							{
								type: 'bug',
								text: `Fix a simulator issue where Skewer Rat's tokens would not be taunted.`,
							},
							{
								type: 'bug',
								text: `Fix a simulator issue where minions killed by Prestor would still deal damage to the attacker.`,
							},
							{
								type: 'ui',
								text: `Fixed image for Kangor's Apprentice.`,
							},
							{
								type: 'ui',
								text: `Changed the default image for Pirates and Beasts in the banned tribes widget.`,
							},
							{
								type: 'ui',
								text: `Now properly show the active hero skin on the Live Stats tab.`,
							},
							{
								type: 'misc',
								text: `Reduce the CPU usage when quickly mousing over the minions tiers on the minions list overlay.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add support for Ooops, All Spells in Duels.`,
							},
							{
								type: 'bug',
								text: `The "turns to win/lose" were incorrectly computed on ranked decks. These stats have been reset, and new matches will now properly compute them. Sorry for the inconvenience.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the "Upgrade this and shuffle it into your deck" treasure in Duels would not properly show the upgraded card in the decklist.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where sometimes a tooltip would not disappear.`,
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
