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
		version: '13.3.1',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `If you ever wonder what the total play time for each mode looks like for ALL of Firestone users, I have published an infographics on Twitter: https://x.com/ZerotoHeroes_HS/status/1726691418687832090?s=20
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'arena',
						details: [
							{
								type: 'feature',
								text: `Card stats now have more info about pick rate, including pick rate for runs that went to 6+ wins. Please be aware that it might take a few days to gather enough data to have reliable stats.`,
							},
							{
								type: 'feature',
								text: `Premium users can now see the pickrate of each card directly on the overlay.`,
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
								text: `Fix a sim issue where Venomstrike Trap and Snake Trap could trigger on a full board.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where minions that were reborn could attack out of order.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Broodmother's Onyxian Whelp would mess up the attack order after attacking immediately.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Embrace Your Rage would not be properly accounted for if another Start of Combat hero power triggered before it.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Stormpike Lieutenant would buff the board, instead of the tavern.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the same secret could appear multiple times in the secrets tracker.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'feature',
								text: `If you run HearthArena at the same time as Firestone and are not a premium user, the "go premium" banner that appears below the draft (if you have the "show draft stat" setting turned on) will now move to the side.`,
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
