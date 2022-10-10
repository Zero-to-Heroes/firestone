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
		version: '9.13.4',
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
					// {
					// 	category: 'general',
					// 	details: [
					// 		{
					// 			type: 'feature',
					// 			text: `Add a "live stream" tab where you can see who is streaming Hearthstone (and using Firestone). It is still in its very early stage, and am looking for feedback in how to make this as useful as possible for viewers and streamers alike`,
					// 		},
					// 	],
					// },
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Add an "appear on live streams" option in the Twitch settings, in preparation for a future feature. If you're a streamer and don't want to be referenced in Firestone in the future, you probably should probably turn that option off.`,
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
								text: `Add support for Steamcleaner.`,
							},
							{
								type: 'bug',
								text: `Fix C'Thun counter.`,
							},
							{
								type: 'bug',
								text: `Fix card highlight for Jace Darkweaver.`,
							},
							{
								type: 'bug',
								text: `Fix a bug with some secrets being greyed out after a minion was countered by Objection!.`,
							},
							{
								type: 'bug',
								text: `Fix an info leak with Incriminating Psychic.`,
							},
							{
								type: 'content',
								text: `Add card oracle for Cheat Death.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue when Leapfroggers and Fish of N'Zoth are involved together.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'ui',
								text: `Make ability usage and cooldown counters easier to see when the ability is in cooldown.`,
							},
							{
								type: 'ui',
								text: `Fix the display of tiers for mercenary equipments that don't start at tier 1 (like Reno"s 3rd equipment).`,
							},
							{
								type: 'ui',
								text: `Improve the background image of the tiles in the Action Queue to make the skill more visible.`,
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
