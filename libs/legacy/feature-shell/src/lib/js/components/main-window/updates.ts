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
		version: '13.19.6',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `This release aims at adding as many features for the new Perils in Paradise expansions ahead of its official launch. Since they have been added while the cards themselves are not playable, please keep in mind that some of these might be a little buggy, so please leet me know if you encounter something that doesn't work as it should. <br/>
			// 	And many more goodies will come once I'm finally able to play with the cards and see how some of these actually work :)
			// 	`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'general',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `A very first version of the Guilds feature is now available! They will allow you to share all kind of things Hearthston-related with your friends or communities. This first version adds a shared leaderboard for all game modes, and more things are planned for the future (let me know what you'd like to see!). Please note that guild creation is not yet publicly available, and is for now reserved to streamers who contact me directly on Discord.  <br/> The goal is to first see what are the features that click with the community, and then open it up to everyone.`,
			// 				},
			// 			],
			// 		},
			// 	],
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
								text: `Add support for "open decklist" brawls, which means that both players' lists will be revealed when they are known before the match. This applies (a bit late) to this week's brawl (Henchmania!), but mostly will let me add better support for such future brawls.`,
							},
							{
								type: 'content',
								text: `Overheal cards now highlight cards that restore health.`,
							},
							{
								type: 'content',
								text: `Add more card oracles (flagging the card in the opponent's hand) and card highlights.`,
							},
							{
								type: 'content',
								text: `The mulligan guide now shows up when playing against the AI. For now, it doesn't use up any of the free uses you have for the day if you're not a premium sub.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Reska's dead minions counter would only include minions that died for your side.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Rest in Peace would not show Popstar as a potential target.`,
							},
							{
								type: 'bug',
								text: `Reset the remembered spells from cards like Tidepool Pupil / Commander Sivara when they are put back in the deck.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the constructed deckbuilder would allow all cards from another class (instead of only Perils in Paradise cards) when adding a Tourist.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue with Shadowy Construct.`,
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
