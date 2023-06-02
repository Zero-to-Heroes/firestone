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
		version: '11.2.13',
		force: false,
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `The last patch has been more bumpy than I expected. If you find that the app doesn't track your games properly, please first try restarting Hearthstone, and see if the problem persists. Thanks again for your patience and support!`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `(PREMIUM) Premium users now have a Profile Page online (see mine at https://www.firestoneapp.gg/profile/daedin). For now it only includes a collection overview, but I will add more things in the coming weeks. Let me know what you would like to see there!`,
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
								text: `Add a Naga Giant counter.`,
							},
							{
								type: 'feature',
								text: `You can now see the cards that will be resurrected by Stranglethorn Heart directly as related cards by mousing over it in the tracker. This means it will also work in the Legacy view of the tracker.`,
							},
							{
								type: 'feature',
								text: `Added a card Oracle for Plagiarizarrr.`,
							},
							{
								type: 'bug',
								text: `Fix the card Oracle for Fight Over Me.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the correct deck would sometimes not be detected properly.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where battles would stop registering in the "simulator" tab when facing the same opponents multiple times in row in the final 1 vs 1 showdown of a lobby.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where hero stats would sometimes not load properly when starting a BG game.`,
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
