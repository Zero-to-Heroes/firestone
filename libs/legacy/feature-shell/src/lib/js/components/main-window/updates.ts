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
		version: '12.0.0',
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
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Deck meta stats are here! You can now see detailed stats for decks to pick whatever will work best for you on the ladder. This is still an early version, so expect some bugs and missing features.
								There are still many things planned for the near future (some of these features will be available to premium users only):
								<ul>
									<li>Additional filters (let me know which ones you need!)</li>
									<li>Archetype stats</li>
									<li>Detailed matchup stats</li>
									<li>Detailed card stats</li>
								</ul>
								Also, a big thanks to https://www.d0nkey.top for sharing their archetype categorization with us!
								`,
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
								type: 'bug',
								text: `Fix the tooltip for the Grey Sage Parrot counter in the settings.`,
							},
							{
								type: 'content',
								text: `Add most of the missing oracles and card highlights for Caverns of Time.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `(Premium) Fix a bug where golden mininos would be auto-highlighted even when The Golden Arena anomaly was active.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Banana Slamma would buff itself after being summoned in combat.`,
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
