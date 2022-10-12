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
		version: '9.13.7',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `This release, and probably the next couple ones, will focus on bug fixes and often requested Quality of Life improvements. So nothing super exciting, but I hope you'll enjoy the updates nonetheless.`,
			},
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
								text: `Add support for multiple activations of Dew Process (via Solar Eclipse for instance) in the "global effects" section to better track how many cards you will draw.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where "Unknown card"s would be removed from the list every time a card was played.`,
							},
							{
								type: 'bug',
								text: `Fix an info leak that revelead the card's cost and rarity in the "Hand" section of the tracker when drawing a card from the deck that was previously reveleaed (like Renathal).`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the opponent board overview would be half hidden if using both "display at the bottom" and "increased size" options.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `The values for the "dust filter" dropdown now match more closely the dust values of the different rarities (Community Contribution!).`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where some speed buffs (like Alexstrasza's Amulet of Swiftness) were incorrectly applied to all abilities.`,
							},
							{
								type: 'bug',
								text: `Fix broken stats tabs. The sample size is still very small, so take the data with a grain of salt.`,
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
								text: `Fix and improve how sounds are organized when looking at a card's details (Community Contribution!).`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Remove the safeguard that prevented users from moving the overlays / widgets outside of the game bounds. Let me know if you'd prefer to have it back, at the cost of a bit less control over how everything is positioned.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the notifications would get cropped when using a Windows zoom level of more than 100%.`,
							},
							{
								type: 'bug',
								text: `Fix the behavior of the "maximize" button when a window is restored as maximized.`,
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
