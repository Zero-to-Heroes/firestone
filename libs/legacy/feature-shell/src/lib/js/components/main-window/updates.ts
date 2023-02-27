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
		version: '10.3.0',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `Thank you all for using Firestone. It means a lot to me that so many of you use something that I made. I wish you a very happy new year.`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add an icon to merge deck versions together. This is not a functional change, but it should make the deck merge feature easier to discover and understand.`,
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
								type: 'feature',
								text: `The MMR graph (in the Rating tab) now doesn't always start at 0, and focuses more on the current rank.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue where Teron's Hero Power could cause the first attacker to be recomputed.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue where Amber Guardian could sometimes apply its buff twice.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Show the Volatile Skeleton counter in some cases when Xyrella is in the deck.`,
							},
							{
								type: 'feature',
								text: `Secrets created by Tear Reality now exclude Standard secrets.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Sir Finley would not remove cards at the bottom of the opponent's deck.`,
							},
							{
								type: 'bug',
								text: `The +X modifiers (for cards like Ignite) are now hidden when using the Legacy display mode (when Modern Tracker is turned off). They will be reintroduced later on once I'm able to properly do it in that display mode.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `You can now reset the main window positions from the system tray icon. This should help for the rare case where some of these windows get moved outside of the screens.`,
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
