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
		version: '9.8.30',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					As you might know, Firestone is an open-source project, and this release is the first including quite a few contributions from the community. So I'd like to take the opportunity to specifically thank Boris (piedpiper on GitHub) for his recent contributions :)
				`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Deck versioning is there! You can now drag and drop a deck onto another one to create a new version of it. See <a href="https://youtu.be/_2tSzgge5No" target="_blank">this video</a> for a quick overview.`,
							},
							{
								type: 'bug',
								text: `Fix some an info leak where Kobold Illusionist would reveal the location in the opponent's hand of the copied card.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'feature',
								text: `Fix an issue where the replay viewer would never finish loading while used in the app.`,
							},
							{
								type: 'feature',
								text: `Locations should now be properly supported in replays.`,
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
								text: `The heroes stats are not limited anymore to the last million games, so data for higher ranks should be more accurate.`,
							},
							{
								type: 'feature',
								text: `Add the "last updated date" information on the heroes tier list.`,
							},
							{
								type: 'bug',
								text: `Minion tooltips in the simulator now show tavern tier instead of mana crystals (community contribution!).`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add/fix card highlight for Im-Ending Catastrophe, Jerry Rig Carpenter, Imp King Rafaam, Raid Boss Onyxia.`,
							},
							{
								type: 'feature',
								text: `Fix/add Card Oracles for quite a few new cards.`,
							},
							{
								type: 'feature',
								text: `The 'fuse" in the turn timer now go up instead of down, to reflect that the time counter itself is counting up.`,
							},
							{
								type: 'ui',
								text: `Replace the icon for archive / unarchive decks (community contribution!).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Secrets Helper would sometimes gray out Double Cross when 1 mana was left.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Abyssal Curse counter would sometimes skip a curse when your opponent's hand is full.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Secrets Helper would gray out secrets that trigger on minion play (like Explosive Runes) when a location is played.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the "copy deck" button could sometimes become too small (community contribution!).`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Show 0 as MMR instead of "null" in the quick-select deck widgets when no MMR is available (community contribution!).`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'ui',
								text: `Add several small improvements in the layout / tooltips of the Progression page (community contribution!).`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'ui',
								text: `Increase the size of the Tavern Brawl icon (community contribution!).`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the opponent's name would not appear when looking at matches of an Arena run (community contribution!).`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `Don't show the pity timers on mini-sets and adventures (community contribution!).`,
							},
							{
								type: 'feature',
								text: `Move Standard and Wild packs to the "Main packs" section of the Packs stats (community contribution!).`,
							},
							{
								type: 'bug',
								text: `Mousing over a golden card in the card history now properly shows a golden tooltip (community contribution!).`,
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
