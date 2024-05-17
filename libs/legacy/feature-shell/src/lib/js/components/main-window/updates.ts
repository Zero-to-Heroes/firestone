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
		version: '13.13.4',
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
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `I am reworking how the "tribe impact" is computed, and will be trying to make it clearer what this stat actually means. It has now been renamed "strongest when in Lobby", to reflect that it shows which tribes that have the biggest effect on a hero performance. This is still a work in progress, so please let me know if you have any feedback on this.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'feature',
								text: `I have added a "My Stats" page that summaries stats across your Arena runs. Here as well, let me know what you think, and what you would like to see :)`,
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
								text: `Fix an issue where Zilliax would not be properly tracked when shuffled back into the deck.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Whizbang deck card summary would not appear in the Global Effects when played by the opponent.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Add a search bar to the Battlegrounds Heroes stats page.`,
							},
							{
								type: 'bug',
								text: `Fix more simulation issues. The simulator for both Solos and Duos should be in a pretty good state now, but as usual, it's not perfect - so let me know if you encounter weird things.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the app wouldn't retrieve the MMR for the players in the lobby anymore.`,
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
