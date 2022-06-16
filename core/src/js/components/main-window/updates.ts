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
		version: '9.8.0',
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `
			// 		IMPORTANT: I have started to receive quite a lot of error reports about the app not loading. In many case, this was caused by the Internet Service Provider not allowing access to the https://static.zerotoheroes.com domain. If you're facing issues with the app, please check out <a href="https://github.com/Zero-to-Heroes/firestone/wiki/FAQ---Troubleshooting" target="_blank">the FAQ</a> for some debugging tips.
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Add a "Buckets" tab that lets you browse the contents of all available buckets`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add a basic deckbuilder for constructed. It's still an early version, so please let me know what other features you'd like to see in there :).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the bonus from Amulet of Undying would disappear when dredged.`,
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
								text: `Add a way to delete decks directly from the "Decks" page, without having to go into each deck individually.`,
							},
							{
								type: 'bug',
								text: `Fix a, issue where a card that was previously at the Top or Bottom of deck would appear again in that zone after going back to the deck from your hand.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `Add a way to delete decks directly from the "Decks" page.`,
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
