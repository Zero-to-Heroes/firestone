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
		version: '11.2.3',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `Firestone is now operational once again! There's still some work needed to support all the new content from 26.2, and that will arrive in the coming days. But the app is now usable again, and you can track your games, see your stats, and use the deck tracker in all game modes. Thanks for your patience!`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'general',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `(PREMIUM) The firestoneapp.gg website has been updated with momre Duels stats and filters. The Battlegrounds section now shows which tribes have the best impact on each hero's average position.`,
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
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add a Menagerie counter.`,
							},
							{
								type: 'feature',
								text: `Add a Corpse spent counter.`,
							},
							{
								type: 'feature',
								text: `Track all activations of Vampiric Blood in the Global Effects.`,
							},
							{
								type: 'bug',
								text: `Fix oracle for Melomania.`,
							},
							{
								type: 'content',
								text: `Add oracles for Tidestone of Golganneth, Kiri Chosen of Elune and Moonbeast.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where updating a minion in the simulator would remove its enchantments.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue when Dragons are buffed during battle.`,
							},
							{
								type: 'content',
								text: `Don't show the "unsupported composition" warning when Bassgil is on the active player's board.`,
							},
							{
								type: 'content',
								text: `Improve CPU consumption when playing BG. This will mostly manifest in long games.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Add the ability to click on a hero / hero power / signature in the tier list to see the top decks with this card.`,
							},
							{
								type: 'feature',
								text: `Add a way to search for top decks containing a given card.`,
							},
							{
								type: 'content',
								text: `Rework how memory reading is handled in Duels. This should improve the reliability of runs detection, and should reduce slightly the resources consumptions of the app while playing Duels.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where ETC Band Manager would not always be properly handled, especially in the first matches of a run.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the meta stats would not appear anymore.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Add an option to disable the local cache.`,
							},
							{
								type: 'content',
								text: `Add a (non-localized, for now) error when there are no messages in the inbox.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the decklists would not order cards alphabetically within a given mana cost.`,
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
