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
		version: '9.12.2',
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
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `All card sounds are now localized! Go listen to your favorite lines in whatever language your app happens to be in! :)`,
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
								text: `Fix a sim issue where Amber Guardian Start of Game effect was ignored.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add a widget for Monstrous Parrot that tells you the last friendly deathrattle that triggered.`,
							},
							{
								type: 'bug',
								text: `Fix a bug that would crash the tracker in some rare cases.`,
							},
							{
								type: 'bug',
								text: `Fix an info leak with Nellie's Pirate Ship.`,
							},
							{
								type: 'bug',
								text: `Fix cards highlight when playing Tess (and similar cards) as a non-Rogue.`,
							},
							{
								type: 'bug',
								text: `Reset the bottom / top positions of cards in the tracker after Order in the Court is played.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Creating a Task Team from the Tasks List should now properly use the current default portrait and equipment.`,
							},
							{
								type: 'ui',
								text: `Redesign the roles charts in the mercs team widget (Community Contribution!).`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where you could click on "watch" on the BG replays that are displayed on the side of the app on certain screens (Community Contribution!).`,
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
