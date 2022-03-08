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
		version: '8.9.0',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					The following weeks will be focused on Duels. This release adds a couple of features and bug fixes, and more is coming. Also, if you have specific wishes for Duels support in Firestone, now is the time to ping me on Discord :)
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
								type: 'misc',
								text: `The app is now open for translation! If you want to help, please visit <a href="https://github.com/Zero-to-Heroes/firestone-translations/blob/main/README.md" target="_blank">this link</a>`,
							},
							{
								type: 'misc',
								text: `The part of the app that handles reading the game's memory has been improved. It should now be more robust, and you will see notifications appear when the reading process had to restart (which can degrade the app's features until it is fully restarted).`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `You can now see the synergies each of the offered Treasures have with your deck. For some of them (like Orb of Revelation) I wasn't too sure about what exactly to highlight, so feel free to let me know if some of them don't make enough sense.`,
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
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the selected treasure would not appear in the decklist for the first match.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `I have reversed how highlights for Drekthar works, as it feels more useful to see which minions it can pull from your decks (instead of the ones that potentially prevent it from activating).`,
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
