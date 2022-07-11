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
		version: '9.8.12',
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
								text: `Fix Card Oracle for Mailbox Dancer, Secure the Deck, Violet Spellwing, Cap'n Rokara, Libram of Wisdom and Dragon Breeder.`,
							},
							{
								type: 'feature',
								text: `Add card highlight for Insight, Switcheroo, Cowardly Grunt, Primordial Protector and Raise Dead.`,
							},
							{
								type: 'feature',
								text: `Add global effects for Prince Renathal and Snapdragon.`,
							},
							{
								type: 'feature',
								text: `Implement "Top of Deck" for Spy-O-Matic, Draconic Herald and Timeway Wanderer.`,
							},
							{
								type: 'feature',
								text: `Add a search function for personal decks.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Abyssal Curse counter would show incorrect info if a Curse could not be sent to the player's hand because it was full.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Bottomfeeder would not properly appear at the bottom of deck with the +X bonus for the opponent.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Add a specific icon for private lobbies in the replays / session recap widget.`,
							},
							{
								type: 'feature',
								text: `Keep widgets open on the end lobby screen. This should notably let you see the odds of the last match if you have the "hide odds in combat" option turned on.`,
							},
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
