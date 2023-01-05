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
		version: '10.0.25',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `Thank you all for using Firestone. It means a lot to me that so many of you use something that I made. I wish you a very happy new year.`,
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
								text: `Firestone now support mods (only on the beta build for now)! Head over to the <a href="https://github.com/Zero-to-Heroes/firestone/wiki/Mods" target="_blank">wiki</a> for more details, and in the Settings > General > Mods tab. Only one mod exist so far, but an often-asked-for one: AutoSquelch :)`,
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
								text: `The app now properly tracks multiple global effects triggered when Brann is present.`,
							},
							{
								type: 'feature',
								text: `Playing Lor'Themar now properly doubles the C'Thun size counter.`,
							},
							{
								type: 'feature',
								text: `Dredging a Dragon created by Lady Prestor now shows it correct, discounted cost in the tracker.`,
							},
							{
								type: 'feature',
								text: `Some widgets (like Shockspitter) won't appear anymore when playing Classic.`,
							},
							{
								type: 'content',
								text: `The Volatile Skeleton counter will now only appear for you when Kel'Thuzad is in your deck.`,
							},
							{
								type: 'bug',
								text: `Fix multiple display issues when using the tracker in the "legacy" display mode.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Soul Seeker would cause the tracker to bug and not remove the solen card from the deck.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where cards played by effects (e.g. Nagaling) were not always properly handled in the tracker.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Dragons created by Lady Prestor would not disappear from the deck when playing Kazakusan.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the deck winrate would sometimes not update properly after the opponent reveals themselves to be a Rogue.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where some graphs (like warband stats) would not properly show the "delta vs last turn" information.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where you could not scroll the decklist that appears while choosing a treasure.`,
							},
							{
								type: 'bug',
								text: `Fix a missing scrollbar when viewing the final decklist of runs in the High-Wins decks section.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `Add an option (under Settings > General) to disable the Mailbox, or hide the Mailbox' unread messages red dot.`,
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
