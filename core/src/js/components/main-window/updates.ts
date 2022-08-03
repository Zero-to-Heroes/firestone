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
		version: '9.8.25',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					I hope you're all having fun with the new expansion! All the new cards should now be properly supported - and if not, don't hesitate to open a bug report with the icon at the top right of the app's main window :)
				`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix an info leak that would let you know what card your opponent picked after playing a "Suspicious" card.`,
							},
							{
								type: 'bug',
								text: `Fix an info leak when playing Theotar, the Mad Duke.`,
							},
							{
								type: 'bug',
								text: `Fix an info leak when playing Identity Theft.`,
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
								text: `Add a widget for Lady Darkvein that tells you what was the last Shadow spell you played.`,
							},
							{
								type: 'feature',
								text: `Add a counter to keep track of dead Volatile Skeletons.`,
							},
							{
								type: 'feature',
								text: `Add card highlight for Clockwork Assistant.`,
							},
							{
								type: 'feature',
								text: `Add Card Oracle for Suspicious Alchemist / Pirate / Usher, Conqueror's Banner and The Harvester of Envy.`,
							},
							{
								type: 'feature',
								text: `Cards created by Devouring Swarm, Selective Breeder and Jackpot now show a gift icon in hand.`,
							},
							{
								type: 'feature',
								text: `Cards added to your deck by Tome Tampering now have their cost set to 1.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Location cards would not be properly handled on the board.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Double Cross would not be properly grayed out after the Coin had been played on the same turn.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the winrate stats would sometimes be slightly off.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Prince Renathal would not appear in the Global Effects section.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix card highlight for Band of Bees.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Add missing treasures synergies highlights for before 24.0 (it will take a few days to gather enough data for the new treasures).`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `All the missing sounds are now available in the app. When playing sounds, the app now properly cycles between the different variations (if there are multiple flavors).`,
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
