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
		version: '7.5.0',
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
						category: 'general',
						details: [
							{
								type: 'ui',
								text: `New navigation menu redesign for the main app!`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `Add stats when browsing each set, including total amount of packs ever opened for that set.`,
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
								text: `Add an option to show the matchup stats as win-loss instead of percentages in the Deck details tab.`,
							},
							{
								type: 'bug',
								text: `Now properly show the pieces of C'Thun in the tracker once more.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where Shenanigans would be greyed out by the secrets tracker if the opponent made you draw 2+ cards during their turn.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where Pen Flinger would be shown as the first card to the left (instead of the right-most one) in the opponent's hand right after being bumped back.`,
							},
							{
								type: 'bug',
								text: `Add more safeguards to prevent the counters or the secret helper from being moved off-screen.`,
							},
							{
								type: 'bug',
								text: `Fix cards being always flagged as 'M' in the opponent's hand after a reconnect. Cards drawn before the reconnect will still show as 'M' (this is a fix for a future version), but subsequent cards drawn will properly show the turn at which they are drawn now.`,
							},
							// {
							// 	type: 'ui',
							// 	text: `(ALPHA) Add archetype id below the deck name when viewing deck details.`,
							// },
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Show pinned minions earlier when you're refreshing the tavern.`,
							},
							{
								type: 'ui',
								text: `The live HP graph now use the same color for each player throughout the whole game (instead of changing the color based on the player current's leaderboard position), which should make it easier to follow things.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where the simulator would sometimes let Illidan attack again after using his hero power.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the live stats could sometimes show incorrect HP for enemy heroes we just faced.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `Add an option to change the size of the cards / card backs / hero portraits in the collection.`,
							},
							{
								type: 'content',
								text: `Add support for Forged in the Barrens.`,
							},
							{
								type: 'ui',
								text: `Sets are now sorted from newest to oldest.`,
							},
							{
								type: 'bug',
								text: `Lots of small-ish UI bugs have been fixed, mostly linked to the card sounds and navigation.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `The app now remembers the last tab you were on in your previous session, and restores to it.`,
							},
							{
								type: 'ui',
								text: `Premium supporters: the empty ad space should now be totally removed from the main app.`,
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
