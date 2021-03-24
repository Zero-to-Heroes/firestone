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
		version: '7.5.12',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Forged in the Barrens Mega Bundle giveaway!',
			// 	text: `
			// 		Instead of using giveaways to get more people to like and follow a Twitter account, I would like to use this opportunity to thank all of you who have been using Firestone so far. You don't need to do anything to enter, I will simply pick someone at random who has played at least a match between 2021-02-15 and 2021-02-25 (while using Firestone, otherwise I have no way to know).
			// 		<br/>
			// 		ATTENTION: you need to have created an account and be logged in Overwolf so that I can contact you.
			// 		<br/>
			// 		<br/>
			// 		If you want to spread the love of the app though, please feel free to do so :) The more people use the app, the more relevant the stats and global info become, and the closer I can get to be a real full-time Firestone dev, which would let me keep the flow of updates going :)
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
								text: `Show missing achievements for heroes on hero selection screen.`,
							},
						],
					},
					// {
					// 	category: 'achievements',
					// 	details: [
					// 		{
					// 			type: 'feature',
					// 			text: `(ALPHA) A second-screen window can be activated for non-BG matches that shows you the current progress on each achievements, and highlighting the achievements that have progressed during the current match.`,
					// 		},
					// 	],
					// },
					{
						category: 'collection',
						details: [
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
								type: 'ui',
								text: `Show the current run's info on top of the community info on the various graphs to make it more legible.`,
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
