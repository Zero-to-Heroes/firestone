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
		version: '9.9.1',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					I'm aware of a recent info leak that lets you see the card picked by your opponent after a Discover effect. I suspect that this change (in the Hearthstone logs) is not intended and will be fixed. I have contacted Blizzard to get their stance on this. If they decide not to fix it, I will then patch the app to hide the information.
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
								type: 'feature',
								text: `Fix an info leak (yeah, there have been a lot of these recently) when Prince Renathal is drawn by a tutor.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where The Coin was not always properly removed from the opponent's hand (e.g. when stealed by Theotar).`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `The High-Wins Decks should now have a better representation of the various decks that go to 10+ wins. They will now only show at most 3 samples for a given hero power / signature treasure / passives combination.`,
							},
							{
								type: 'feature',
								text: `A Passives Treasures filter has been added to the High-Wins Decks tab.`,
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
								text: `Add Gory the Mightree to the Global Effects section.`,
							},
							{
								type: 'feature',
								text: `Add card highlight for Grey Sage Parrot, and gift icons for Plagiarize and Steward of Scrolls.`,
							},
							{
								type: 'bug',
								text: `Today, Kidnap (the Rogue secret) doesn't trigger on Immune minions. The Secrets Helper has been updated to reflect this. I'm not yet 100% convinced that this behavior is intended, so I might revert this change in the future.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix the new deck name not always showing up after renaming a Duels deck.`,
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
