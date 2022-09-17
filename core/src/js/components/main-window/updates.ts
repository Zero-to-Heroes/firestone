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
		version: '9.11.1',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		I'm aware of a recent info leak that lets you see the card picked by your opponent after a Discover effect. I suspect that this change (in the Hearthstone logs) is not intended and will be fixed. I have contacted Blizzard to get their stance on this. If they decide not to fix it, I will then patch the app to hide the information.
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Add stats for Quests Rewards. IMPORTANT NOTE: in BG, the difficulty of the Quest is also an important parameter to consider (not only the reward). They are also dependent on which hero / tribe you're playing with. All this data will probably come in the future, but for now please don't give more weight to these stats than they deserve.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Add a button to automatically create a team based on your current Tasks. See <a href="https://youtu.be/bc9hBmICksw" target="_blank">here</a> for a short video showing it in action.`,
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
								type: 'bug',
								text: `Fix rounding issue when showing quest XP in the quests widget.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Relic Counter would be off by 1 (the tooltip was correct).`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Battle odds should pop right when the final match is over if you opted to show the battle odds only in the Tavern.`,
							},
							{
								type: 'ui',
								text: `Improve the border of the hero stats tooltips (Community Contribution!).`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `You can now go directly from '???' to 'Maxxed' in the Tasks Completed column by just goign backward from ???.`,
							},
							{
								type: 'ui',
								text: `Improve the general look-and-feel of the team widgets (Community Contribution!)`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix deck code generation (mostly for Vanndar / Drek'Thar) incorrectly referencing vanilla heroes. Please note that older deck codes may still have the issue (the fix is not retroactive).`,
							},
							{
								type: 'bug',
								text: `Fix hero search not working.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `Pack order should now be more intuitive when looking at the "Packs" stats (Community Contribution!)`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `The Quests widget will also appear in the Collection screen.`,
							},
							{
								type: 'ui',
								text: `A few visual improvements here and there (Community Contribution!)`,
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
