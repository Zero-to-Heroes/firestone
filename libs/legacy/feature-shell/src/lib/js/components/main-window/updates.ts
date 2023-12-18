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
		version: '13.2.1',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `If you ever wonder what the total play time for each mode looks like for ALL of Firestone users, I have published an infographics on Twitter: https://x.com/ZerotoHeroes_HS/status/1726691418687832090?s=20
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
								type: 'feature',
								text: `(PREMIUM) You can now set a custom message through your status on Discord! Placeholders now only include the current game mode and hero name, but let met know on Discord if you'd like some more options :) See <a href="https://github.com/Zero-to-Heroes/firestone/wiki/Firestone-features#general">the wiki</a> for some screenshots.`,
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
								text: `You can now choose whether some widgets (like Spell Schools or Menagerie) display their items all on one line, or each on a separate line. Go to the Settings > Decktracker > Global at the bottom to change this.`,
							},
							{
								type: 'feature',
								text: `Deck stats should now update more frequently, and display the time at which they were last updated. Beware that the sample size will be a little smaller during the first few days.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Dragons Summoned counter would not include ALL tribes.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the attack counter would not take the weapon's durability into account.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Add an option to show the spells at the bottom of the minions list.`,
							},
							{
								type: 'feature',
								text: `Add a new "Tavern Spells" section in the minions list overlay.`,
							},
							{
								type: 'feature',
								text: `Hero stats should now update more frequently, and display the time at which they were last updated. Beware that the sample size will be a little smaller during the first few days.`,
							},
							{
								type: 'ui',
								text: `Remove filters linked to Quest and Anomalies.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue that would occur rarely with Diremuck Forager.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Lighter Fighter.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Live Stats would not refresh properly.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where re-deleting a deck that was deleted once in the past wouldn't work.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the hero power / signature treasure info was sometimes missing when viewing your own runs overview.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'feature',
								text: `Add a dropdown to filter by opponent class for ranked games.`,
							},
							{
								type: 'misc',
								text: `Improved the performance while loading replays, especially for BG.`,
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
