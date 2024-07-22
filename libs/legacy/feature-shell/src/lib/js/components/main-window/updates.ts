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
		version: '13.19.1',
		force: false,
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `This release aims at adding as many features for the new Perils in Paradise expansions ahead of its official launch. Since they have been added while the cards themselves are not playable, please keep in mind that some of these might be a little buggy, so please leet me know if you encounter something that doesn't work as it should. <br/>
				And many more goodies will come once I'm finally able to play with the cards and see how some of these actually work :)
				`,
			},
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
								text: `When mousing over Tidepool Pupil in your decklist, you can now see the 3 spells you can discover from when active. It will also show you the spells that have been "stored" if you haven't yet played 3 spells.`,
							},
							{
								type: 'feature',
								text: `Add a "locations used" counter for Seaside Giant.`,
							},
							{
								type: 'feature',
								text: `Add a counter for Snatch and Grab that tracks how many cards from another class you've played this game. `,
							},
							{
								type: 'feature',
								text: `Add a counter for Sea Shanty that tracks how many spells you've played on characters this game. `,
							},
							{
								type: 'feature',
								text: `Add a counter for Damage Taken on your turn, for cards like Sauna Regular or Party Planner Vona. `,
							},
							{
								type: 'feature',
								text: `The deckbuilder now properly supports Tourist cards.`,
							},
							{
								type: 'content',
								text: `Add more card highlights and oracles (flagging the card in the opponent's hand) for the new Perils in Paradise expansion.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the cost of cards in hand/deck would still be updated even if the "update card cost" option was disabled in the settings.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the simulator could sometimes crash because of Fish of N'Zoth.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the class filter would not work properly.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the high-wins runs could contain some obviously corrupted lists with multiple legendaries.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Guilds now have a tab for Friendly Battles! If both players from the same Guild play a friendly game, it will appear in the Guild's tab.`,
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
