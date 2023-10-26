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
		version: '12.4.7',
		force: false,
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `This release for now mostly contains technical updates. I'm trying to make the app load faster, and decrease the memory it uses overall, especially if you're only using one or two modes. It will take a while to get there, so expect the improvements to be very gradual. </br>
				This first phase focuses on making the app load faster when on desktop (i.e. HS is not running).
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
			// 					type: 'content',
			// 					text: `The app has been updated for patch 27.6. There are still some things to work on, and probably some bugs that were introduced, and I will iron this out over the next few days. Enjoy the new patch!`,
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
						category: 'general',
						details: [
							{
								type: 'content',
								text: `Update for 27.6.2.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'content',
								text: `Miscellaneous small updates to widget texts, oracles and card highlights.`,
							},
							{
								type: 'bug',
								text: `Fix some issues with stealth reconnects - the game logs would behave as though a reconnect was happening, but without any visible effect in the UI. This would cause the tracker to sometimes stop working.`,
							},
							{
								type: 'bug',
								text: `Fix an issue the cards in ETC's sideboard would appear in the Other zone when playing ETC.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Plagues created by Helya would sometimes not be properly tracked and could cause the tracker to stop working.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue with Diremuck Forager.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Goldrinn.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with the Anomalous Evidence anomaly.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the buttons to quickly build a deck when starting a new run would not appear anymore.`,
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
