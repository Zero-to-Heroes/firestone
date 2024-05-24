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
		version: '13.14.5',
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
								text: `You can now customize the color of the background for some of the widgets. This is a very early step towards more customization, so don't hesitate to send me your feedback if you have any!`,
							},
							{
								type: 'feature',
								text: `(Premium) The Hero Selection Overlay stats has been improved, and should now make it clearer what the impact of the current tribes is on each hero's average position, as well as align the look and feel with how other similar stats are presented.`,
							},
							{
								type: 'feature',
								text: `Non-premium users can use the Hero Stats Overlay for free once every day.`,
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
								text: `Fix an issue where Unpinning a minion in the minions list would unpin all of them.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the MMR / Tribes filter was not taken into account when building hero stats (and the hero tier list) in-game.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the MMR graph tab would mix Solo and Duos. You can now select which game mode you want to Rating graph for.`,
							},
							{
								type: 'bug',
								text: `Fix multiple simulation issues`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'content',
								text: `Repackaged Box now show you the contents of the Box when mousing over it in the decklist.`,
							},
							{
								type: 'content',
								text: `Add several card oracles (flag the correct card in the opponent's hand).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where merging decks would sometimes not work, or sometimes split them apart.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'feature',
								text: `You can now filter High-Wins Runs based on legendary cards.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `(Twitch) You can now see the hero portrait when mousing over it.`,
							},
							{
								type: 'feature',
								text: `(Twitch) (Constructed) Add a button to minimize the tracker.`,
							},
							{
								type: 'feature',
								text: `(Twitch) (Constructed) Add an option to color the mana cost of cards in the tracker.`,
							},
							{
								type: 'feature',
								text: `(Twitch) (Constructed) Mousing over a card in hand also highlights related cards in the tracker.`,
							},
							{
								type: 'feature',
								text: `(Twitch) (Battlegrounds) Add a mouse over for the hero's completed quest (yes, that's coming late, but at least it will be there for the next time Quests are live).`,
							},
							{
								type: 'feature',
								text: `(Twitch) (Battlegrounds) When mousing over Sire D's hero power, it will now show the quest reward, instead of the hero power image.`,
							},
							{
								type: 'feature',
								text: `(Twitch) (Battlegrounds) Add spells in the minions list (this can be turned on/off from the extension's overlay Settings by each user).`,
							},
							{
								type: 'bug',
								text: `(Twitch) The Settings panel now will keep its size even when changing the size of the overlays.`,
							},
							{
								type: 'bug',
								text: `(Twitch) Fix an issue where the language set in the Settings was not always taken into account.`,
							},
							{
								type: 'bug',
								text: `(Twitch) Fix an issue where order of the cards on the board was not always refreshed.`,
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
