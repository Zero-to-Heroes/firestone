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
		version: '9.7.9',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					IMPORTANT: I have started to receive quite a lot of error reports about the app not loading. In many case, this was caused by the Internet Service Provider not allowing access to the https://static.zerotoheroes.com domain. If you're facing issues with the app, please check out <a href="https://github.com/Zero-to-Heroes/firestone/wiki/FAQ---Troubleshooting" target="_blank">the FAQ</a> for some debugging tips.
				`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'general',
						details: [
							{
								type: 'content',
								text: `App has been updated for patch 23.4 (this was actually done last week, but I never had the time to write proper release notes). I am still receiving more error reports than usual, so expect a few more bug fixes in the coming days.`,
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
								text: `Fix a sim issue where the minion summoned by Ozumat's Tentacular hero power would sometimes not be taken into account.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add Bottom of Deck support for Disarming Elemental and Drown.`,
							},
							{
								type: 'bug',
								text: `Fix an info leak when drawing a card from a tutor (e.g. a "draw a spell" card) while having one copy in the deck and one copy in the "Bottom of deck" zone. The tracker used to tell you exactly which copy you drew. Now, it assumes that the copy from the "in deck" zone was drawn.`,
							},
							{
								type: 'bug',
								text: `Fix Card Oracle (flagging the card in the opponent's hand) for Loan Shark.`,
							},
							{
								type: 'bug',
								text: `Fix info leak where cards burned by Immolate would be revealed in the Other zone.`,
							},
							{
								type: 'bug',
								text: `Fix info leak where Coilfang Constrictor would reveal too much information. As a result, you won't even see the revealed cards in the "In Hand" section, as showing this info while managing the memory leak would lead to too much spaghetti code.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where Rush minions would be counted in the attack counter the turn they were played.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `You can now click on a card in a bucket to add it to your decklist (if it is a valid card for deckbuilding).`,
							},
							{
								type: 'bug',
								text: `Fix a bug where the deckbuilder would sometimes offer non-Core version of some cards. I'm still not sure exactly what the rules are when several versions of the same cards can be added to your deck, so expect a few more bugs / improvements needed on that one.`,
							},
							{
								type: 'bug',
								text: `Fix a bug where deck codes for heroes with dual-class signature treasures would sometimes be incorrect.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'bug',
								text: `Available secrets for the secrets helper should now be updated.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Voyage to the Sunken City is now once more part of the Standard sets.`,
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
