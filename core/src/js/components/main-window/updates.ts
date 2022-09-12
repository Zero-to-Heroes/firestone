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
		version: '9.10.1',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		I'm aware of a recent info leak that lets you see the card picked by your opponent after a Discover effect. I suspect that this change (in the Hearthstone logs) is not intended and will be fixed. I have contacted Blizzard to get their stance on this. If they decide not to fix it, I will then patch the app to hide the information.
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
								text: `Add a widget to easily see all your current Battlegrounds quests.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add a widget to easily see all your current Hearthstone quests.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where leaving the game while spectating (without closing the app) would prevent the app from recording further games until it is restarted.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Add turn counters, both for the current battle and for the map in total.`,
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
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix cards created by Magnetic Mines (Rattlegore's hero power).`,
							},
							{
								type: 'bug',
								text: `Add the "gift" icon in hand for some more cards.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue when Tamsin uses her hero power on an empty board.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue when gilding already golden minions.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Remove warning in deckbuilder for the League of Explorer heroes.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where some passive treasures would still show a speed.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'bug',
								text: `Fix the match time not showing properly.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'ui',
								text: `Various improvements of how the app looks, especially in non-English languages (Community Contribution!).`,
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
