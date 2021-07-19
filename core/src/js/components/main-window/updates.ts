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
		| 'collection';
	readonly details: UpdateSectionItemDetails[];
}

export interface UpdateSectionItemDetails {
	readonly type: 'feature' | 'bug' | 'ui' | 'content' | 'misc';
	readonly text: string;
}

export const updates: readonly Update[] = [
	{
		version: '7.11.0',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		This release has some moderate logging enabled to try and help me debug some issues that seem to arise randomly: Reckoning being greyed out inappropriately, and the tavern timing turn in BG being off by 1 in the future. <br/>
			// 		So if you encounter one of these issues, by all mean please open a bug report! :) <br/>
			// 		You might therefore face some lags (mostly in BG), but overall I think things should be fine. <br/>
			// 		<br/>
			// 		Have fun, and thanks again for all the help :)
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'arena',
						details: [
							{
								type: 'feature',
								text: `There is a new Arena tab that tracks your runs and rewards (very similar to what we have for Duels). It's still pretty lightweight, and can/will be improved in the future. Let me know your suggestions!`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where Close the Portal hero power was not implemented in the simulator for minions summoned in combat.`,
							},
							{
								type: 'misc',
								text: `The BG window will stop popping up after a match ends. This was introduced to make sure users could see the post-match stats, but since these are now computed in real time it makes less sense to forcefully open a window without the user asking to.`,
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
								text: `Decrease the smallest possible size of the trackers (in the settings).`,
							},
							{
								type: 'bug',
								text: `Fix missing images in opponent's hand for cards created by Instructor Fireheart's chain creates.`,
							},
							{
								type: 'content',
								text: `Add card highlights for Firemancer Flurgl and Scavenger's Ingenuity.`,
							},
							{
								type: 'content',
								text: `Add card guess for card drawn by Gnomish Inventor.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'ui',
								text: `Minions inside each tribe are now ordered alphabetically.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'bug',
								text: `Fix resources (mana, coins) not showing on some replays.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'future',
			// 	header: 'Under the Hood',
			// 	text: `

			// 	`,
			// },
		],
	},
];
