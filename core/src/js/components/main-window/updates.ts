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
		version: '9.8.11',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		IMPORTANT: In the future, decks you play with might be shared (anonymously) with the community if they perform well at a high rank. If you don't want others to find out about your secret decklists (I think that can especially be true for high-level Legend players), please turn off the new "Allow game sharing" option under Settings > General.
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `In the deckbuilder, show the number of different buckets a card is in.`,
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
								text: `Fix Card Oracle for Mailbox Dancer.`,
							},
							{
								type: 'feature',
								text: `Add card highlight for Insight and Switcheroo.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Abyssal Curse counter would show incorrect info if a Curse could not be sent to the player's hand because it was full.`,
							},
							{
								type: 'bug',
								text: `Add a search function for personal decks.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Remove the flickering that could happen when showing the opponent's latest info.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix cards from an incorrect class being offered when building a deck after clicking on the "build a deck" widget.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Add a filter for owned / not owned.`,
							},
							{
								type: 'bug',
								text: `Don't show negative speeds in combat.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'feature',
								text: `Add the match duration in the replays list.`,
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
