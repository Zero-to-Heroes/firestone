export interface Update {
	readonly sections: readonly UpdateSection[];
	readonly force: boolean;
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
		version: '13.12.2',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `IMPORTANT: some people have reported app crashes since the latest updates. The reports for now have all been on Battlegrounds, so I'm disabling the new Quests live stats for now. Please let me know if this improves the situation for you (you can reach out on Discord: https://discord.gg/vKeB3gnKTy or by using the "Report a bug" feature at the top right of the app's main window).
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
								text: `Mulligan guide is live for Arena! Upon card selection during the mulligan, the app will show an overlay with the impact / pick rate of the cards being offered, as well as the impact of all cards in your deck. Premium users have illimited use of this features, while others can use it for up to 3 games per day.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `A new "Competitive" rank filter is available for meta stats (decks and archetypes). The idea is to limit the stats to users who are really trying to win, and so only includes Top 2000 Legend and Diamond 1-4 players. The mulligan overlay data still includes all players from Diamond to Legend to make sure the sample size is big enough, but this can be adjusted in the future.`,
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
								text: `Fix some sim issues for Duos. There will still be quite a few iterations needed, but I'm finally starting to address Duos-specific sim issues :)`,
							},
							{
								type: 'bug',
								text: `Fix a display issue where the hero card would be incorrect in the battle recap tab if your teammate went first.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'feature',
								text: `Add the "Played on Curve Winrate" stat to the Cards Stats tab.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where you had to click twice on the Firestone system tray icon to restore the app's main window.`,
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
