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
		version: '12.0.3',
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
								type: 'content',
								text: `Add most of the missing oracles and card highlights for Caverns of Time.`,
							},
							{
								type: 'bug',
								text: `Fix the tooltip for the Grey Sage Parrot counter in the settings.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Treant counter would not show up.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'content',
								text: `You can now again choose "Poisonous" as a minion attribute in the simulator.`,
							},
							{
								type: 'content',
								text: `You can now filter Tier 7 minions in the simulator.`,
							},
							{
								type: 'bug',
								text: `(Premium) Fix an issue where golden mininos would be auto-highlighted even when The Golden Arena anomaly was active.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the opponent's information would not be properly updated when facing them multiple times in a row.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Banana Slamma would buff itself after being summoned in combat.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Amalgadon would do nothing when its battlecry got triggered by Rylak.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where the Undead Legion attack buff would not apply to minions already on board.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where "on attack" buffs would not be consistently applied if the defender had an "on being attacked" trigger.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Feathermane would not always be summoned from hand.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where importing a battle from the Replays tab into the Simulator would not import the anomalies.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the heroes' player stats in the overlay would always use the current anomaly and MMR rank filters, even if these were disabled.`,
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
