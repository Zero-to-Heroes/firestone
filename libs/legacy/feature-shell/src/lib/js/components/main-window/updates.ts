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
		version: '13.19.11',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `This release aims at adding as many features for the new Perils in Paradise expansions ahead of its official launch. Since they have been added while the cards themselves are not playable, please keep in mind that some of these might be a little buggy, so please leet me know if you encounter something that doesn't work as it should. <br/>
			// 	And many more goodies will come once I'm finally able to play with the cards and see how some of these actually work :)
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `App has been updated for 30.0.3`,
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
								text: `Add an Elemental Streak counter for the opponent, to keep track of how many elementals they played in a row. It will only show up if the opponent played at least 2 elementals in a row, and is deactivated by default.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the opponent trading a card would not make it appear in their deck.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where "pay with health" cards like Blood Treant would count towards the self-damage widget (used by Party Planner Vona).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the attack counter would not always update (for instance when playing a minion whose aura buffs your board)`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Add a counter for how many pirates you've played this game. It only appears if buddies are in and you're Patches, or if you have Tuskarr Raider (Patches' buddy) in hand or on board.`,
							},
							{
								type: 'bug',
								text: `Fix sim issues with Ozumat's Tentacular and Cultist's updated power.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'content',
								text: `Add missing catch-up packs to the Packs tab.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where receiving a golden card in a pack would reset the pity timer for the corresponding rarity.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `[Guilds] Add an Internal MMR for Friendly battles. This is still very experimental, and will probably be replaced by a way to create on-demand, temporary ladders or tournaments. If you're part of a guild and use this feature, please let me know what you think :)`,
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
