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
		version: '11.8.10',
		force: false,
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `There have been many small versions released during the past couple of weeks, without proper release notes. This is a summary of the changes that have been made since the last proper release notes.`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `You can now browse the stats for each anomaly in-app. Premium users can decide to use the current anomaly to have the stats be filtered by the current anomaly directly in the overlay.`,
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
								text: `(PREMIUM) Premium users can now have some minions be automatically highlighted in the shop based on their current hero (like Freedealing Gambler when you are Patches).`,
							},
							{
								type: 'feature',
								text: `Add toggles to easily turn the MMR and Anomaly filters on/off in the BG window.`,
							},
							{
								type: 'bug',
								text: `Add support for the Denathrius and Master Nguyen anomalies.`,
							},
							{
								type: 'bug',
								text: `Fix a simulatin issue where Tavish's hero power damage was incorrect.`,
							},
							{
								type: 'bug',
								text: `Fix a simulatin issue with Surf's spellcraft spell.`,
							},
							{
								type: 'bug',
								text: `Fix aan issue where some minions would not appear as banned with some anomalies.`,
							},
							{
								type: 'bug',
								text: `Fix aan issue where the buddies list would not appear when playing with the Bring in the Buddies anomaly.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'content',
								text: `Mousing over Unending Swarm now directly shows you the target as related cards.`,
							},
							{
								type: 'content',
								text: `Add multiple card highlights and oracles.`,
							},
							{
								type: 'bug',
								text: `Improve the app's behavior when reconnecting to a game.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where card tooltips would sometimes flicker when hovering over the decklist.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the C'Thun buff counter would not be properly recorded if there are no C'Thun known in your deck.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the C'Thun buff counter would ignore health-specific buffs.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where a few secrets were missing or not properly implemented (Caverns of Time's Snipe and Wild's Spellbender).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where secrets would be greyed out in the Secrets Helper even if Tight-Lipped Witness was in play.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where cards at the top/bottom of the deck would still appear as "in deck" when using the Legacy view of the tracker.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the tracker would sometimes not properly track dredged cards, especially in no-deck mode (like for Tavern Brawls).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where "spells played this match" counters would count non-spell cards played."`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the previous decklist would show up when choosing a signature treasure in your next run.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the card sounds would not play correctly.`,
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
