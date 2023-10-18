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
		version: '12.3.1',
		force: false,
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `This release is the first fully-functional iteration of the Constructed Meta Stats! I hope you enjoy it :) <br/>
				Next up is to add overlays to help you during the Mulligan phase; but first I want to make sure that the stats provided in the app are correct, so please let me know if you spot any issue!
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
								text: `The app has been updated for patch 27.6. There are still some things to work on, and probably some bugs that were introduced, and I will iron this out over the next few days. Enjoy the new patch!`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `(PREMIUM) You can now browse all meta archetypes, view the core cards to the archetypes, and browse all decks that are part of the archetype.`,
							},
							{
								type: 'feature',
								text: `(PREMIUM) You can now view card-level stats for each deck and archetype. This will tell you each card's Mulligan winrate, drawn winrate and kept percentage.`,
							},
							{
								type: 'feature',
								text: `(PREMIUM) You can now view how each deck or archetype performs against other classes.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Try and make everything linked to duels detection more robust. This should reduce the number of times some loots, initial decklists or sideboards being incorrectly detected. WARNING: because of a change to how runs are identified, the first game you play with this version of the app will start a new run. Sorry for the inconvenience.`,
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
								text: `Replaced the "all-time" filter with a "current-season" filter in the constructed meta tabs. (Community Suggestion!)`,
							},
							{
								type: 'feature',
								text: `Added an "all ranks" filter for constructed meta tabs.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some treant-generating cards would not be properly highlighted when mousing over Cultivation. (Community Suggestion!)`,
							},
							{
								type: 'ui',
								text: `Move the "legend" star to be less intrusive when viewing the list of decks and archetypes. (Community Suggestion!)`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where changing the MMR / Anomaly filter would sometimes not update the tierlists.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the achievements and hero stats info would not be correctly aligned when choosing between only two heroes. (Community Suggestion!)`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Recurring Nightmare could enchant non-Undead minions. (Community Suggestion!)`,
							},
							{
								type: 'content',
								text: `You should now see a "now loading" animation when changing some of the filters.`,
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
