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
		version: '7.3.13',
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
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `You can now track all the card backs you've unlocked (and the ones you're still missing).`,
							},
							{
								type: 'feature',
								text: `You can now track all the card backs hero skins you've unlocked (and the ones you're still missing).`,
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
					// {
					// 	category: 'battlegrounds',
					// 	details: [
					// 		// {
					// 		// 	type: 'feature',
					// 		// 	text: `(ALPHA) You can now enable highlighting of minions that match specific tribes in the tavern.`,
					// 		// },
					// 	],
					// },
				],
			},
			{
				type: 'minor',
				header: 'Minor updates',
				updates: [
					// {
					// 	category: 'decktracker',
					// 	details: [
					// 		// {
					// 		// 	type: 'ui',
					// 		// 	text: `(ALPHA) Add archetype id below the deck name when viewing deck details.`,
					// 		// },
					// 	],
					// },
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `The simulator will now wait until the minion is created by Embrace Your Rage (Y'Shaarj's hero power) to compute the win chances.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'ui',
								text: `Missing cards are now shown using a lower opacity, instead of the previous red filter.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'ui',
								text: `Fix a bug where secrets that are discovered would not have a proper image.`,
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
