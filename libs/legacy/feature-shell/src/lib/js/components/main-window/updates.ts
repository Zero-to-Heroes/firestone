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
		version: '12.5.19',
		force: false,
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `Someone from the community found out that Firestone might cause game animations stutters when the game's FPS were uncapped.<br/><br/>
				To fix this, edit the options.txt file in %localappdata%\Blizzard\Hearthstone and add targetframerate=60 (or another value).<br/><br/>				
				Let me know if that helps!
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
			// 					text: `Fix an issue where the tracker would get stuck if the app was started while a game was already in progress.`,
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
								text: `You can now leave the "related card" popup open for certain cards (like cards that Excavate) by holding the "Shift" key as you mouse out of the card in the tracker. That will let you scroll through all the options in the window.`,
							},
							{
								type: 'feature',
								text: `Add new counters (Tram Heist, The Garden's Grace, Dragons Summoned) and improve the Excavate counter.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where cards created by enchantments would appear as a broken image.`,
							},
							{
								type: 'bug',
								text: `Remove the flicker that could sometimes happen when mousing over cards in the tracker.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `The perfect games tab is finally fully restored! And it has been enhanced with tribes/anomalies filters.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Cultist S'Thara would appear in the minions list when demons are banned.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue with Golden Niuzao.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `Add proper support for catch-up pack openings.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where using Mass Opening would sometimes not properly track all cards/packs.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'misc',
								text: `Miscellaneous improvements that should reduce CPU usage of the app while playing the game.`,
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
