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
		version: '13.19.3',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `This release aims at adding as many features for the new Perils in Paradise expansions ahead of its official launch. Since they have been added while the cards themselves are not playable, please keep in mind that some of these might be a little buggy, so please leet me know if you encounter something that doesn't work as it should. <br/>
			// 	And many more goodies will come once I'm finally able to play with the cards and see how some of these actually work :)
			// 	`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'general',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `A very first version of the Guilds feature is now available! They will allow you to share all kind of things Hearthston-related with your friends or communities. This first version adds a shared leaderboard for all game modes, and more things are planned for the future (let me know what you'd like to see!). Please note that guild creation is not yet publicly available, and is for now reserved to streamers who contact me directly on Discord.  <br/> The goal is to first see what are the features that click with the community, and then open it up to everyone.`,
			// 				},
			// 			],
			// 		},
			// 	],
			// },
			{
				type: 'minor',
				header: 'Minor updates',
				updates: [
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Show the minions added in the Minion Sandwich when mousing over it in the decklist.`,
							},
							{
								type: 'feature',
								text: `Update the "Top of deck" zone after playing Overplanner.`,
							},
							{
								type: 'feature',
								text: `Track spells that will be replayed by Mistah Vistah's Scenic Vista.`,
							},
							{
								type: 'feature',
								text: `Update Eruption damage info when they are upgraded in deck.`,
							},
							{
								type: 'feature',
								text: `Add spell schools already played as related cards to Carress, Cabaret Star.`,
							},
							{
								type: 'feature',
								text: `Show the Spell Schools widget for Razzle Dazzler.`,
							},
							{
								type: 'feature',
								text: `Add a Dead Minions counter for Reska, the Pit Lord.`,
							},
							{
								type: 'feature',
								text: `Show the card that will be replayed by Sunwing Squawker when mousing over it in the decklist.`,
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
