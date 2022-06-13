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
		version: '9.7.19',
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
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `The issue that some of you were experiencing and that was preventing the app from loading should now be properly fixed, and in a way that should be future-proof. Sorry again for the inconvenience of these past couple of weeks if you were affected by it.`,
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
								type: 'feature',
								text: `Add toggle buttons on the Hero Selection screen to activate live filters for tribe and MMR (i.e. use the tribes and MMR of your current game, instead of the app's current values).`,
							},
							{
								type: 'ui',
								text: `Improve the display of the hero stats overlay when mousing over the various hero choices.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Ini Stormcoil's hero power was missing.`,
							},
							{
								type: 'bug',
								text: `If you're using the "live tribes" and "live MMR" filters for hero stats, the value of the filter is now properly reset to its previous value after leaving a BG game.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Properly flag cards created by Remote Controlled Golem in deck.`,
							},
							{
								type: 'feature',
								text: `Show Nellie's Pirate Ship Crew when mousing over the card in the tracker (for those like me who keep forgetting what you picked).`,
							},
							{
								type: 'feature',
								text: `Add a few of Diablo's treasures in Duels to the Global Effects section.`,
							},
							{
								type: 'bug',
								text: `Slightly change how the Abyssal Curses counter works to solve an issue that would arise when facing Cariel. The counter now gives you the highest damage curse your opponent has received.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the rewards on the Runs screen would reset after completing a new run.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where some bounties were missing the "Heroic" label when looking at where to farm specific merc coins.`,
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
