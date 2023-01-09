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
		version: '10.1.0',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `Thank you all for using Firestone. It means a lot to me that so many of you use something that I made. I wish you a very happy new year.`,
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
			// 					text: `Firestone now support mods (only on the beta build for now)! Head over to the <a href="https://github.com/Zero-to-Heroes/firestone/wiki/Mods" target="_blank">wiki</a> for more details (or ping me on Discord), and in the Settings > General > Mods tab. Only one mod exist so far, but an often-asked-for one: AutoSquelch :)`,
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
								text: `Improve detection of copied cards in the opponent's hands. Spells copied by Lady Deathwhisper will now be properly identified after the original has been played (and similar improvement for Elementary Reaction).`,
							},
							{
								type: 'feature',
								text: `Flag the card transformed in the opponent's hand by Plaguespreader's effect.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Patchwerk would not delete the card in the deck.`,
							},
							{
								type: 'bug',
								text: `Fix an incorrect highlight for Bonecaller.`,
							},
							{
								type: 'bug',
								text: `Fix an info leak when playing From De Other Side.`,
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
