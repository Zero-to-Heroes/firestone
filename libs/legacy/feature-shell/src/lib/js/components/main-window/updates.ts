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
		version: '11.0.0',
		force: false,
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `With this version, the Premium accounts will now be $5 / month, and will offer more ease-of-use and quality of life features. Please see <a href="https://github.com/Zero-to-Heroes/firestone/wiki/Premium-vs-ads" target="_blank">the wiki</a> for more details, as well as an exhaustive list of features that will be available to premium users.  
				<p>
				Relatedly, the right column of the app's main window will now be used for ads for free users.
				<p>
				I think it is not too bad. Most of the information that used to be there can be seen it via other (though less convenient) means directly from the app as well. As for the information that is now exclusive to premium users, I feel that it's usually not vital information, but rather nice-to-have bonuses (like the cards history).
				<p>
				As usual, I'm open to feedback, so let me know what you think on Discord!
				`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Duels now has real tier lists for Heroes, Hero Powers, Signature Treasures, and Active and Passive Treasures.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'minor',
			// 	header: 'Minor updates',
			// 	updates: [
			// 		{
			// 			category: 'battlegrounds',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `Add an option to show a notification when a BG game ends to quickly view your game's stats.`,
			// 				},
			// 				{
			// 					type: 'feature',
			// 					text: `Add a way to show buddies when selecting minions in the simulator.`,
			// 				},
			// 			],
			// 		},
			// 	],
			// },
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
