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
		version: '9.16.1',
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
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Add an experimental mailbox system. Many of you have expressed concern that some important information like server-side patches or important events were not mentioned inside the game client. This mailbox aims at pushing the information to you, so that you are always up-to-date with important in-game information.`,
							},
							{
								type: 'feature',
								text: `Add a Tavern Brawl tab. It will give you the winrate for each class for the current Tavern Brawl, as well as let you quickly copy a high-winrate deck code for any given class. I'm assuming that most people are interested in quickly finding a deck that lets them complete the brawl, so this tab is for now intentionally very minimal. Let me know your thoughts!`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `When playing "Guess the Weight", the tracker now shows you the odds for each option. While this particular card is not super popular (being a Wild-only card), it opens the door to showing more contextual information when being offered a discover. Let me know what you'd like to use this for on Discord!`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `The Pity Timers are now on the "Packs" tab. The diversity of bundles and pack types made it confusing to show the pity timers as linked to sets, so they will now be tied to their specific pack type.`,
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
								text: `Fix an issue where the Simulator tooltip would get messed up after going once to the Replays tab (Community Contribution!).`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Add highlight for abilities with combo effect (Community Contribution!).`,
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
