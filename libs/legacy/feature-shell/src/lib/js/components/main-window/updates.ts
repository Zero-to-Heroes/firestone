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
		version: '10.0.23',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `I wanted to thank you for using Firestone. It means a lot to me that so many of you use something that I made. I wish you all a very happy new year.`,
			},
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'decktracker',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `Loaner decks are now properly supported.`,
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
								text: `The app now properly tracks multiple global effects triggered when Brann is present.`,
							},
							{
								type: 'feature',
								text: `Playing Lor'Themar now properly doubles the C'Thun size counter.`,
							},
							{
								type: 'bug',
								text: `Fix multiple display issues when using the tracker in the "legacy" display mode.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where cards played by effects (e.g. Nagaling) were not always properly handled in the tracker.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Add an option (under Settings > General) to disable the Mailbox, or hide the Mailbox' unread messages red dot.`,
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
