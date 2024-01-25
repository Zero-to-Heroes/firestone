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
		version: '13.2.25',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `If you ever wonder what the total play time for each mode looks like for ALL of Firestone users, I have published an infographics on Twitter: https://x.com/ZerotoHeroes_HS/status/1726691418687832090?s=20
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'arena',
						details: [
							{
								type: 'feature',
								text: `Card and Class Stats are now updated every hour and tell you when they were last updated.`,
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
								text: `Add a new setting to show the Plagues at the top of the deck to better keep track of them. The setting is ON by default.`,
							},
							{
								type: 'feature',
								text: `When the opponent plays a card stolen from your deck by Benevolant Banker, it is now removed from your "Deck" section.`,
							},
							{
								type: 'content',
								text: `Mousing over highlander cards like Reno, Lone Ranger now highlights all duplicates in your deck.`,
							},
							{
								type: 'bug',
								text: `Fix an info leak where the card created by Shattered Reflections would be revealed when drawn by the opponent.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Add a counter to tell you how much more (or less) gold you will have next turn.`,
							},
							{
								type: 'feature',
								text: `The list of Buddies will now always show when spells are in the tavern.`,
							},
							{
								type: 'bug',
								text: `Fix an issue with the in-app simulator where the simulation would sometimes never end.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'feature',
								text: `Add a filter in hte Cards Stats tab to show only Neutral cards, or conversely exclude them and show only class cards.`,
							},
							{
								type: 'feature',
								text: `Add a filter in hte Cards Stats tab to show only Legendary or Treasure cards.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Passive treasures that grant Spell Damage will now only highlight cards in your deck that deal damage.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where some heroes would be put in an incorrect faction, causing some issues with highlights during the treasure selection phase.`,
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
