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
		version: '11.7.9',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `The last patch has been more bumpy than I expected. If you find that the app doesn't track your games properly, please first try restarting Hearthstone, and see if the problem persists. Thanks again for your patience and support!`,
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
								text: `Mousing over the "average position" stat, either in the overlay or in the app's UI, now shows the details on how the stats are computed.  I feel that with anomalies coming and adding another layer of stats, this may help give more weight to what the stats say (and/or help me find some bugs :D)`,
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
								type: 'feature',
								text: `Mousing over a card that uses different spell schools (like Inquisitive Creation) now highlights the spells in your deck and hand that have spell schools you haven't played yet.`,
							},
							{
								type: 'content',
								text: `Demon Hunter and Death Knight are momentarily removed from the Twist deckbuilder, in preparation of the first Twist season coming with patch 27.2.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Lady Darkvein's counter widget would incorrectly consider spells that got countered.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Secret Helper would sometimes not show the correct list for secrets created by Tear Reality.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where you could not log in to Out of Games anymore.`,
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
