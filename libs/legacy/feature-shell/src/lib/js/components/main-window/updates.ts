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
		version: '10.0.13',
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
								text: `The deckbuilder now supports the new Death Knight runes system.`,
							},
							{
								type: 'bug',
								text: `Fix an info leak where Souleater's Scythe would reveal mininos consumed eaten at the start of the game.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `Add a button to reset the pity timers for a given pack type.`,
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
								text: `When playing with / facing a Death Knight, the tracker will now recap the runes composition of that deck at the top of the tracker.`,
							},
							{
								type: 'feature',
								text: `Mousing over a Bound Soul (the token created by Souleater's Scythe) now shows you which minions you can discover.`,
							},
							{
								type: 'feature',
								text: `Add a widget for Bonelord Frostwhisper telling you how many turns you have left until you die.`,
							},
							{
								type: 'feature',
								text: `Add a widget for Anachronos counting down the number of turns until the minions come back.`,
							},
							{
								type: 'feature',
								text: `Add a widget for Asvedon to help you remember the last spell your opponent played.`,
							},
							{
								type: 'feature',
								text: `Add a counter for Shockspitter telling you how much damage it will do, when it is in your deck (or being offered as a Discover choice). When enabling this for the opponent, it will show if they are playing Hunter and have attacked at least once.`,
							},
							{
								type: 'feature',
								text: `Add card highlights, global effects and oracles for some of the new cards.`,
							},
							{
								type: 'feature',
								text: `When looking at a deck's stats, add an icon next to versions of that deck that are archived.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where cards consumed by Souleater's Scythe would not be removed from the deck.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where cards destroyed by Patchwerk would not always be removed from the deck / hand.`,
							},
							{
								type: 'bug',
								text: `Fix some Deathknight icons not being rendered correctly.`,
							},
							{
								type: 'bug',
								text: `Fix a visual issue where the layout of the deck details for decks with Versions was broken.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some secrets (like Explosive Runes) would be ruled out when the opponent plays a Dormant minion.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue where Amber Dragon could buff non-dragon minions.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Interrogator Whitemane double damage would work in reverse.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the Tasks widget would not show up anymore.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the text of some of the new Procedural quests would still contain placeholders.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix pity timers being incorrectly reported if you opened a Legendary in the first 10 packs and you had not yet opened 10 packs in total.`,
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
