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
		version: '10.2.3',
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
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Mods support is almost ready! I have added more visual feedback, and a way to automatically update the mods from the Mods screen in the settings. If you'd like to give it a try before it hits the live build (and help me make sure everything works properly ^^), please let me know on Discord.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `The Heroes tab now contains Meta stats (in addition to your own stats), to let you know how each hero performs for the player base, depending on the rank and available tribes. Let me know what you think :)`,
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
								text: `The session widgets now displays the name of the hero. The tribes present in the lobby now only show when mousing over that particular game.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issues where divine shields would sometimes not be removed after taking non-attack damage (eg from Kaboom Bot).`,
							},
							{
								type: 'bug',
								text: `Fix a sim issues where Denathrius quests would be ignored.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where you couldn't set the Eternal Legion and Undead Army buffs at the same time in the simulator.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where hitting the "reset" button in the simulator would not reset the hero power and quest reward.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Magmaloc counter's tooltip would give an incorrect value.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where tribes would sometimes not be properly recorded when uploading a game.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where you wouldn't see the full board when mousing over games in the session widget.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the "popup post-match stats" option would not work anymore.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the "show global effects" option would not work for the opponent's deck.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Bleeds created by Garrote were added to the wrong deck.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where some passive treasures could appear as Signature Treasure for high-win runs. This fix is however not retroactive (so existing runs can still be buggy).`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where some tasks were sorted incorrectly, which caused the wrong task to appear as the "next task".`,
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
