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
		version: '9.14.0',
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
								text: `Add a "live stream" tab where you can see who is streaming Hearthstone (and using Firestone). It is still in its very early stage, and am looking for feedback in how to make this as useful as possible for viewers and streamers alike`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Add an option to show all Battlecry / Deathrattle minions in the minions list (this adds two more stars next to the tiers 1-6 in the minions list).`,
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
								text: `Add a minion list option to group tribeless minions into their base tribe (e.g. show Wrath Weaver inside the "Demons" group).`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Show the cards replayed by Tess / Contraband Stash in the tooltip when mousing over Tess / Stash.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where secrets created by Nagalings would not trigger the Secrets Helper.`,
							},
							{
								type: 'bug',
								text: `Fix an info leak where Chameleos would reveal the position of the copied card in the opponent's hand.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Add an option to use the new Tasks widget (similar to what already exists in constructed / battlegrounds).`,
							},
							{
								type: 'bug',
								text: `Hide the "Map turns" when playing PvP.`,
							},
							{
								type: 'bug',
								text: `Hide speed value for abilities with Discover and Battlecry effects (Community Contribution!).`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `Add faction and race info to full-card component (faction only for mercs) (Comunity Contribution!).`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the rating graphs would sometimes tell you to select a region.`,
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
