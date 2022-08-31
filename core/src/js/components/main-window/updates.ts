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
		version: '9.9.7',
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
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `The app has been updated for 24.2. Some features are still missing (like a BG XP tracker or proper handling of the quest rewards in the simulator / twitch extension) and should come in the coming days.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Relic counter is here, for you and your opponent! Consequently, relics have been removed from the Global Effects section.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where the Curse counter would be stuck on 1/1 when receiving curses.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Event tasks (like C'Thun's) are now properly tracked.`,
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
								text: `When mousing over your own Commander Sivara in the decktracker, you can now see the spells he will bounce back.`,
							},
							{
								type: 'feature',
								text: `Add a widget for Murozond that tells you all cards that will be replayed.`,
							},
							{
								type: 'feature',
								text: `Add various card oracles, global effects and card highlights.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the deck stats shown in the tracker would not account for all versions of a multi-version deck.`,
							},
							{
								type: 'bug',
								text: `Fix an info leak where Prince Renathal would be flagged in hand if drawn during the mulligan.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where abilities that have a speed of 0 would not show any speed at all.`,
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
