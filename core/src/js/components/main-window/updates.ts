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
		version: '7.12.3',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		This release has some moderate logging enabled to try and help me debug some issues that seem to arise randomly: Reckoning being greyed out inappropriately, and the tavern timing turn in BG being off by 1 in the future. <br/>
			// 		So if you encounter one of these issues, by all mean please open a bug report! :) <br/>
			// 		You might therefore face some lags (mostly in BG), but overall I think things should be fine. <br/>
			// 		<br/>
			// 		Have fun, and thanks again for all the help :)
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					// {
					// 	category: 'battlegrounds',
					// 	details: [
					// 		{
					// 			type: 'feature',
					// 			text: `Full Battle Simulator is now live! (it is still in a very early beta stage though). You can pick any minions you like for both sides, and modify them to fit your needs (stats, divine shield, poison, etc.). It is still missing the ability to choose your hero power, and the UI is still all over the place, but all of these will be fixed soon :)`,
					// 		},
					// 	],
					// },
					{
						category: 'general',
						details: [
							{
								type: 'content',
								text: `The app has been updated for United in Stormwind.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `You can now see a graph of your rank evolution, game-by-game or day-by-day. It's been split in two graphs: one for the Bronze-Diamond leagues, and one for Legend, to make things easier to see.`,
							},
						],
					},
					// {
					// 	category: 'duels',
					// 	details: [
					// 		{
					// 			type: 'feature',
					// 			text: `The leaderboard is here! It shows the top 100 players who use Firestone to record their games. It shows players who have one active run in the last 30 days. This is still an early beta, so please don't hesitate to send your feedback :)`,
					// 		},
					// 	],
					// },
					// {
					// 	category: 'profile',
					// 	details: [
					// 		{
					// 			type: 'feature',
					// 			text: `To start the new Profile tab, here is a graph of your total XP over time. More account-wide stats will be coming soon, so let me know (on Discord or by opening a bug) what you would like to see there :)`,
					// 		},
					// 	],
					// },
				],
			},
			{
				type: 'minor',
				header: 'Minor updates',
				updates: [
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Properly show Quel'Delar's icon in the opponent's hand after it has been forged (mostly for Duels).`,
							},
							{
								type: 'content',
								text: `Update the deck's contents (and add a global effect) after Hemet, Jungle Hunter or Skulking Geist has been played.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `When showing the MMR graph grouped by day, plot ALL the days, even the ones where no games were played.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where minions in the tier lists were not ordered alphabetically.`,
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
