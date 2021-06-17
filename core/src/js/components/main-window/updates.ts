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
		version: '7.9.11',
		sections: [
			{
				type: 'intro',
				header: 'Beta release - important',
				text: `
					This release has some moderate logging enabled to try and help me debug some issues that seem to arise randomly: Reckoning being greyed out inappropriately, and the tavern timing turn in BG being off by 1 in the future. <br/>
					So if you encounter one of these issues, by all mean please open a bug report! :) <br/>
					You might therefore face some lags (mostly in BG), but overall I think things should be fine. <br/>
					<br/>
					Have fun, and thanks again for all the help :)
				`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `PREMIUM: Add a way to resimulate past battles after changing the minion order. This is also the first feature that is fully available only for supporters (you can still re-simulate the early turns if you're not subscribed). You can read more about this <a href="https://github.com/Zero-to-Heroes/firestone/wiki/Battlegrounds---Battle-Resimulation#premium-only" target="_blank">here</a>`,
							},
							{
								type: 'feature',
								text: `Add lethal chances to battle simulator.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add the ability to override the decklist in the tracker (useful in tournaments when you know your opponent's decklist).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the secret cast by Sparkjoy Cheat would cause the secret helper to grey out some options.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where sometimes the deck used when battling a friend would use the previous match's decklist.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'content',
								text: `The community stats now only show the stats for Heroic, whatever filter is selected. Your own stats still show either Casual, Heroic or both depending on the value of the filter. This has been done to drastically reduce the data size and make room for more interesting info.`,
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
								text: `Add a "Last played" filter on the heroes list.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the tavern turn timing would sometimes be off by 1 in the future.`,
							},
							{
								type: 'bug',
								text: `Change the label of the "All time" filter to "Past 100 days", as the app only loads the last 100 games at startup (this can be changed if needed, let me know!).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the stats shown on the hero selection screen would not reflect the time filter set in the app.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some minions would appear twice on the minions list.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Flag the exact card in hand created by Vanessa VanCleef.`,
							},
							{
								type: 'feature',
								text: `Flag the card in hand that receives Aegwynn's buff.`,
							},
							{
								type: 'feature',
								text: `Reveal all enemy secrets in the secrets helper when playing Horde Operative.`,
							},
							{
								type: 'feature',
								text: `Add support for Mindrender Illucia (fixes a few bugs and properly flags the cards in hand upon their return).`,
							},
							{
								type: 'feature',
								text: `Flag as "created by" the cards drawn by Arcanologist (Core), Stage Drive (Corrupted) and Primal Dungeoneer.`,
							},
							{
								type: 'feature',
								text: `Show buff in hand for cards drawn with Stealer of Souls on the board.`,
							},
							{
								type: 'bug',
								text: `Fix potential info leaks when discovering a "cast when drawn" spell in your own deck (this for now impacts Shadow Visions, Tracking and Secret Passage).`,
							},
							{
								type: 'bug',
								text: `Fix a delay when removing the "turn drawn number" when Jandice is played.`,
							},
							{
								type: 'bug',
								text: `Fix a delay when removing the "turn drawn number" for the minion eaten by Mutanus.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Show the passives looted in the run on the high-wins decks list.`,
							},
							{
								type: 'feature',
								text: `Add rank info on the high-wins decks list.`,
							},
							{
								type: 'bug',
								text: `Fix some treasures being incorrectly grouped into the Pool 1 (instead of Pool 2 where they belong) and add a few more treasures to the Ultra Rare bucket.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where multi-set bundles (like the Standard Bundle) would count towards the pity timer of the set of the first card opened in the pack.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where setting the decklist filter then selecting the "All games" filter would still only show replays of game with the previously selected decklist.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'ui',
								text: `Tooltips now have an arrow linking them to the element being highlighted.`,
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
