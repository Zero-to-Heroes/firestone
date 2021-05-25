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
		version: '7.9.3',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		You may have
			// 		<br/>
			// 		<br/>
			// 		This updates mostly brings small-ish Quality of Life improvements. I'll probably have another couples of small update following over the next months to fix / improve existing features, so if you have any feedback or ideas, please don't hesitate to send them to me!
			// 		<br/>
			// 		<br/>
			// 		Take care,
			// 		<br/>
			// 		Seb.
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
								text: `Add a tab to show recent perfect games from the community. You can filter them by hero and by rank.`,
							},
							{
								type: 'bug',
								text: `Fix some simulation issues when the Fish of N'Zoth is involved.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'feature',
								text: `Add filters by hero (BG) and class (constructed / arena / duels).`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add Ladder stats.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `Add a tab with all the voicelines from non-collectible heroes.`,
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
								text: `Add the ability to permanently delete a constructed deck.`,
							},
							{
								type: 'feature',
								text: `Playing Explore Un'Goro now properly replaces all your cards in the decklist.`,
							},
							{
								type: 'feature',
								text: `Add a few more stats to the deck details page, including a pie chart of the opponent's class breakdown (visible only when the window is wide enough).`,
							},
							{
								type: 'feature',
								text: `The counter for Grand Totem Eys'or now increments every time the totem's effect is triggered.`,
							},
							{
								type: 'feature',
								text: `Add Invigorating Sermon to the list of global effects.`,
							},
							{
								type: 'feature',
								text: `Add a "burned" icon for cards milled by Tickatus.`,
							},
							{
								type: 'feature',
								text: `Update the cost of Librams in the deck after a reduction card has been played.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `Add information of how much dust you have from duplicates for each set.`,
							},
							{
								type: 'bug',
								text: `Fix an issue with the Darkmoon Faire pity timer would sometimes not reset after cards from the Darkmoon Races mini set would be pulled from a pack.`,
							},
							{
								type: 'content',
								text: `Add support for standard bundle packs in packs history.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'ui',
								text: `Now show "Perfect!" instead of "1st" in the replays list when winning with your full health remaining.`,
							},
							{
								type: 'ui',
								text: `Tone down the green highlights around cards in Battlegrounds.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Hovering on a minion in the minions list now also shows its golden version.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the battle luck would not have any hero or replay information in the Records Broken tab.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the last battle's chances would not be accessible after the run ends if the chances were set to show only in the tavern.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where a minion's stats would sometimes not be visible in the live stats tooltip.`,
							},
							{
								type: 'bug',
								text: `Add basic support in the simulator for Scallywag + Baron/Khadgar. There are still some limitations, namely in the way Khadgar sometimes summons multiple pirates before the "attack immediately" triggers.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the live hero dealt damage stats would not be computed properly.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Add a button to force an app update when a new version is available.`,
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
