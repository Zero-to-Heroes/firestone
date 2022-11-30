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
		version: '10.0.1',
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
								type: 'content',
								text: `Firestone is now updated for 25.0. As usual, some features will `,
							},
							{
								type: 'misc',
								text: `The app underwent a major technical migration. This should have no impact for you, but please be aware that a few bugs might arise because of it. So don't hesitate to ping me whenever you find something that doesn't work as it should :)`,
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
								type: 'content',
								text: `Glowscale is now part of the Divine Shield group in the minions list.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add a "Parrot Macot" counter (a treasure you can find in some solo adventures).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where deck merge was laggy, and sometimes not working at all.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where dynamic related cards (like the cards Tess would replay) would not appear right away when mousing over the card in the tracker.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Frozen Clone would not be greyed out in the secrets helper.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some discovered cards would not appear in the Other zone.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some some generated cards would not appear properly in the "legacy" display view (the one where you don't have a split of cards by zone).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where related cards for Tess / Contraband Stash / Sivara were not working in the "legacy" display view.`,
							},
							{
								type: 'bug',
								text: `Fix an issue with the "used cards go to the bottom" settings in the "legacy" display view.`,
							},
							{
								type: 'bug',
								text: `Remove the option to NOT darken used cards in the "legacy" display view (so used cards will always be darkened). This setting was never intended to be used in this mode, and could cause some confusion.`,
							},
							{
								type: 'ui',
								text: `Related cards are now bigger and should be easier to read.`,
							},
							{
								type: 'ui',
								text: `Some counters now also show you the image of the card (e.g. the Vanessa VanCleef counter also shows you what the card is, instead of simply telling you its name).`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `When creating a Task team, team will position the mercs configured in the Settings first, then followed by the mercs linked to the task. The reason is that these task-specific mercs rarely have any synergy with the task itself, and so having your pre-configured team first is more efficient.`,
							},
							{
								type: 'bug',
								text: `Restore the task description when mousing over the task progress in the Mercenaries Progression tab.`,
							},
							{
								type: 'content',
								text: `The "tasks list" button has been removed from the team widgets. Please use the "Quests" widget from now on (acccessible from the Settings > General > Quests).`,
							},
							{
								type: 'content',
								text: `The "roles chart" button has been removed.`,
							},
						],
					},
					{
						category: 'achievements',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the achievements history would be empty.`,
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
