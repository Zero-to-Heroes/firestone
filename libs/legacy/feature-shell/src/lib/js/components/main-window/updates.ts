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
		version: '12.5.23',
		force: false,
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `If you ever wonder what the total play time for each mode looks like for ALL of Firestone users, I have published an infographics on Twitter: https://x.com/ZerotoHeroes_HS/status/1726691418687832090?s=20
				`,
			},
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'decktracker',
			// 			details: [
			// 				{
			// 					type: 'bug',
			// 					text: `Fix an issue where the app could have trouble selecting the correct deck when playing Twist.`,
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
								text: `Due to popular feedback, change (once again!) how the Excavate counter works. It will now start at 0, instead of 1. It will also tell you how many times in total you have excavated in its tooltip.`,
							},
							{
								type: 'bug',
								text: `Fix the attack counter not taking mega-windfury into account.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue with Wax Warband, Queen Wagtoggle's hero power.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'feature',
								text: `Add a Class Tier List tab. I am also trying to show in some way the disparity between the wins ditribution of each class, but I am not sure yet how to do it in a way that is easy to understand. Simply showing the total number of wins on a bar graph doesn't work well, because of how many more low-wins there are than high-wins. I've settled for showing how much each class differs from the *average* at each win count. Let me know if you have any feedback on this.`,
							},
							{
								type: 'misc',
								text: `I have reworked how the internal Run ID is computed, which should make it more robust in the future, and also make it work even if you play a game on mobile between two PC games. Unfortunately, this means that after this update, your first match will be part of a new run, which might break your stats. Once again, sorry about that.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where it would sometimes not offer you high-wins decks (or even your last deck) to copy after selecting your hero / hero power / signature treasure combination.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where some data (like all-time packs opened) would not refresh.`,
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
