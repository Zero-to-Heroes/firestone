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
		version: '7.16.0',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		This release adds lots of Quality of Life improvements, which are one of my favorite things to do. I hope you'll enjoy it :)
			// 	`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 	],
			// },
			{
				type: 'minor',
				header: 'Minor updates',
				updates: [
					{
						category: 'battlegrounds',
						details: [
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
								type: 'ui',
								text: `Fixed image for Kangor's Apprentice.`,
							},
							{
								type: 'ui',
								text: `Changed the default image for Pirates and Beasts in the banned tribes widget.`,
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
