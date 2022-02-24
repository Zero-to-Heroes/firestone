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
		version: '8.8.4',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		I just wanted to let you know that you're awesome. Keep it up!
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
								text: `Official release of the "Session widget" feature. This widget recaps your latest placements, latest matches, net MMR and the heroes + final boards you had since you last reset the data. The widget is hidden by default (as it's mostly intended for streamers), but you can enable it in the settings.`,
							},
							{
								type: 'feature',
								text: `Adds some configuration options to the session widget: size, opacity, the ability to show/hide the "grouped" and "individual matches" sections, as well as the ability to decide how many past matches you want to show as details.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `I have received a few reports of the card tooltip staying stuck on screen, with no way to dismiss it. I haven't been able to reproduce the issue myself though. As a temporary fix, card tooltips will auto-hide after 15s.`,
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
								type: 'bug',
								text: `Fix an issue where the Twitch extension would stop receiving updates because the messages sent by Firestone to Twitch were too big.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where the attacking minion would be wrongly picked once all minions had attacked.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Millificient Manastorm's golden buddy would still deal 8 damage.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Tamsin's hero power would always be considered activated.`,
							},
							{
								type: 'bug',
								text: `Remove Hamuul from the minions list.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add an option to change the size of ALL counters.`,
							},
							{
								type: 'feature',
								text: `Flag the Golem created by Kazakus in the opponent's hand.`,
							},
							{
								type: 'feature',
								text: `Add decklist support for old solo adventures.`,
							},
							{
								type: 'feature',
								text: `Add an option for streamers to add a delay to the events sent to Twitch (so that the extension stays synchronized with what users see on stream, especially with a delayed stream).`,
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
