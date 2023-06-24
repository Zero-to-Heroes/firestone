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
		version: '11.4.0',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `The last patch has been more bumpy than I expected. If you find that the app doesn't track your games properly, please first try restarting Hearthstone, and see if the problem persists. Thanks again for your patience and support!`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `You can now display a "lottery" window while playing a game. <br />
								This lets you earn points by doing certain things in game (for this season, it's spending resources, playing spells and playing Quilboars), and a raflle will take place at the end of the month to earn Firestone premium subs. The more points you have, the higher the chances are you'll win (and if you're already premium and you win, we'll find an adequate replacement prize together). <br />
								It's a first version and is still very experimental, but it could open a the way to some fun weekly competitions.<br/><br/>
								
								Also, you will get some of the Premium perks while taking part to the lottery, like the Overlay features, as a thanks for having an ad run on-screen. <br/><br/>
								
								Let me know what you think!`,
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
						category: 'general',
						details: [
							{
								type: 'misc',
								text: `The app's user analytics are now public and accessible by anyone. Head up <a href="https://apps.zerotoheroes.com/firestoneapp.gg-app" target="_blank">here</a> if you want to have a look!`,
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
