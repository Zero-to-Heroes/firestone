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
		version: '7.7.9',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					I'd like to welcome everyone who got to try Firestone because of the lifetime packs received feature. I'm glad to have you here :)
					<br/>
					<br/>
					This updates mostly brings small-ish Quality of Life improvements. I'll probably have another couples of small update following over the next months to fix / improve existing features, so if you have any feedback or ideas, please don't hesitate to send them to me!
					<br/>
					<br/>
					Take care,
					<br/>
					Seb.
				`,
			},
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [],
			// },
			{
				type: 'minor',
				header: 'Minor updates',
				updates: [
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add a Watch Post counter (enabled by default). If enabled, it appears as soon as the opponent plays a Watch Post, or if you have Kargal Battlescar somewhere in your deck / hand.`,
							},
							{
								type: 'feature',
								text: `Add a Libram counter (disabled by default). If enabled, it appears as soon as the opponent plays a Libram, or if you have Lady Liadrin somewhere in your deck / hand.`,
							},
							{
								type: 'content',
								text: `Add more info for cards in the opponent's hand: Efficient Octo-bot buff is now shown, Kazzakus' Golem is now flagged.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the global effect cards would show a ? instead of the actual cost of the card for the opponent.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where drawing an upgraded ranked spell would not remove the corresponding rank 1 copy from the decklist.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where toggling opponents on/off on the HP graph would show/hide the wrong line.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `You can now type "extra" in the search bar to see all cards that you have extra copies of (counting normal / golden / diamond copies). A proper explanation of all the keywords you can use in this field will be coming soon.`,
							},
							{
								type: 'bug',
								text: `Add missing Kobolds and Catacombs pack in the packs overview, and remove the Signup Incentive pack.`,
							},
							{
								type: 'ui',
								text: `Show the total number of packs you received directly in the header. No need to count them manually when sharing to your friends anymore :)`,
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
