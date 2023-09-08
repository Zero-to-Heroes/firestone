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
		version: '11.9.1',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `There have been many small versions released during the past couple of weeks, without proper release notes. This is a summary of the changes that have been made since the last proper release notes.`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `You can now see all minions for a single tribe in the minions list (and of course you can turn that off in the settings).`,
							},
							{
								type: 'bug',
								text: `Reconnections should now be better handled. Reconnects are still a pretty thorny topic, so let me know if you still experience issues after reconnecting to your game.`,
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
								type: 'content',
								text: `The C'Thun counter now only shows the attack value, but still shows both attack and health when you hover over it.`,
							},
							{
								type: 'bug',
								text: `Fix some issues when spectating games that could cause the tracker to stop working until you restarted Hearthstone.`,
							},
							{
								type: 'content',
								text: `Add multiple oracles and card highlights.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `(Premium) When minion auto-highlight is activated, golden minions are now automatically highlighted in the shop.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the buddies list would be empty when playing with the Bring in the Buddies anomaly.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where turning off the "opponent boards" would also turn off the "last opponent" icon.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue when Tavish' hero power kills a minion.`,
							},
							{
								type: 'misc',
								text: `The name of the (premium) setting that lets you use the remote simulator has been changed to "Use remote simulator" to make it more consistent with how other premium settings are labeled (turned off by default).`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where Tess / Contraband stash would only take the hero's first class into accunt when showing the list of cards that would be replayed.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the "My Decks" tab would not show anything if all heroes were unselected.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where some sounds would not be played properly.`,
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
