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
		version: '7.7.0',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					Getting the app fully ready for the core set and Forged in the Barrens expansion was a bit more chaotic than planned, but things should be stable now. This updates is thus a big one, with all the things that I've been delaying until the dust settled from the latest patch. I hope you'll enjoy it :)
					<br/>
					<br/>
					Take care,
					<br/>
					Seb.
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
								text: `Show missing achievements for heroes on hero selection screen.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `The tracker now updates the cards in the list after some global cards are played, like Deck of Lunacy. For now, the effects that are supported are cost changes, and card transform (like Prince Liam). Minions buff and other similar effects are not handled yet.`,
							},
						],
					},
					{
						category: 'achievements',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where full run completion achievements would be awarded after clearing the first round of Dungeon Run or Rumble Run.`,
							},
							// {
							// 	type: 'feature',
							// 	text: `(ALPHA) A second-screen window can be activated for non-BG matches that shows you the current progress on each achievements, and highlighting the achievements that have progressed during the current match.`,
							// },
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `You can now synchronize your collection to Out of Cards via the Settings > General tab.`,
							},
							{
								type: 'feature',
								text: `Show collected coins.`,
							},
							{
								type: 'feature',
								text: `Show all-time packs received. This also includes the info from before you had Firestone.`,
							},
							{
								type: 'feature',
								text: `Show the best packs that you opened while Firestone was running. It also shows the best pack for each set when viewing the stats for that set.`,
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
							// {
							// 	type: 'ui',
							// 	text: `(ALPHA) Add archetype id below the deck name when viewing deck details.`,
							// },
							{
								type: 'bug',
								text: `The secrets helper should now stay where you last dragged it between games.`,
							},
							{
								type: 'bug',
								text: `Now properly shows the opponent's name in their side of the tracker, instead of UNKNOWN HUMAIN PLAYER.`,
							},
							{
								type: 'bug',
								text: `Oh My Yogg! should now be properly handled by the Secrets helper, and spells countered by it should not appear as global effects anymore.`,
							},
							{
								type: 'bug',
								text: `The secrets helper no longer greys out Avenge if all minions die at the same time.`,
							},
							{
								type: 'ui',
								text: `Add an icon for Wild / Classic decks in the deck stats.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `Add an option to show animated card backs instead of static images.`,
							},
							{
								type: 'feature',
								text: `Show the pack history when in the Packs tab.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `(ALPHA) Add option to show multiple graphs at the same time in live stats and replays stats.`,
							},
							{
								type: 'ui',
								text: `Show the current run's info on top of the community info on the various graphs to make it more legible.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'ui',
								text: `Personal runs are now grouped by date.`,
							},
							{
								type: 'content',
								text: `The app now won't show stats for treasures with not enough data points.`,
							},
							{
								type: 'misc',
								text: `The Heroes stat page should now load faster.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'feature',
								text: `You can now filter ranked replays to include only Standard, Wild or Classic matches.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'future',
			// 	header: "What's next",
			// 	text: `
			// 		A few features are on alpha / beta testing phase today:
			// 		<br/>
			// 		<ul>
			// 			<li>(Battlegrounds) A way to highlight specific minions or tribes in the tavern.</li>
			// 			<li>(Constructed) A way to guess the opponent's archetype from the card they have played, and the ability to override their decklist with a popular list from that archetype.</li>
			// 			<li>A way to track the current progress you're making towards achievements while in a match.
			// 		</ul>
			// 		<br/>
			// 		If you are interested in helping me test and polish these, feel free to ping me on Discord :)
			// 		<br/>
			// 		<br/>
			// 		Stay safe,
			// 		<br/>
			// 		Seb.
			// 	`,
			// },
		],
	},
];
