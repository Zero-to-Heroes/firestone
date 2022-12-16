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
		version: '10.0.20',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `This release, and probably the next couple ones, will focus on bug fixes and often requested Quality of Life improvements. So nothing super exciting, but I hope you'll enjoy the updates nonetheless.`,
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
								text: `Loaner decks are now properly supported.`,
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
								text: `Fix an issue where the turn-by-turn winrates in the Battles tab would not update until you got a non-0 winrate chance.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some games were incorrectly flagged as "perfect".`,
							},
							{
								type: 'ui',
								text: `Improve how the "quick opponent recap" (brought up by pressing Tab while in lobby) looks on high resolution screens.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix an info leak where "created by" cards don't show an icon in the opponent's hand, when drawn by a tutor. This would give some info about the card being drawn.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where stolen cards (e.g. by Theotar) are taken into account when building the DK runes widget.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some cards that upgrade when played (like Ignite) have their buff not properly tracked in deck when played by an effect (e.g. Nagaling).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Sivara would show ALL the spells played (instead of the first 3) when mousing over it in the decklist.`,
							},
							{
								type: 'bug',
								text: `Ignore ties when building deck stats.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Add missing Deathknight and Golden Wild packs.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Tutorial quests are now tracked by the quest widget.`,
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
