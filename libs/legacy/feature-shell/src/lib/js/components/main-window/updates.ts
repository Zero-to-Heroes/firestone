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
		version: '13.2.17',
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
								type: 'bug',
								text: `Reconnects should be handled more gracefully now. It is still a tricky subject, so let me know if you experience bugs after reconnecting to your game.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Card stats for meta decks should now (finally) be fixed! Sorry again for the inconvenience.`,
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
								text: `Fix an issue where loaner decks would not be detected.`,
							},
							{
								type: 'bug',
								text: `Fix some issues with the Attack counter (replacing weapons, Charge minions).`,
							},
							{
								type: 'bug',
								text: `Fix the oracle for Fizzle's Snapshot (the cards were not flagged at their correct place in the opponent's hand).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Identity Theft would create two copies of each card in the opponent's deck.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Loaner Decks were not properly detected.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the opponent's Jade Golem counter could not be turned off.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue where some secrets could trigger infinitely.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with minions spawned from hand. I had hoped that I could integrate the in-combat buffs to properly guess the actual stats of the minion in hand, but it turns out that it isn't possible without also requiring a lot of maintenance. So sims where minions are summoned from hand will now be a bit less accurate.`,
							},
							{
								type: 'feature',
								text: `Show cards in hand and secrets in BG simulation replays.`,
							},
							{
								type: 'feature',
								text: `Show minion overlay icons (deathrattle, trigger, poisonous, etc.) on BG simulation replays.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with the location of spawned minions.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with buffing the minions in the opponent's hand.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Reckoning.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Audacious Anchor start of combat behavior.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where minions from a higher tavern tier could still be summoned during combat.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Lighter Fighter would still do 5 damage.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Black Magic Soulstone.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where the first attacker would not be properly recomputed after Tamsin's hero power.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'misc',
								text: `Add clarifications on the tooltips as what the Wins Profile bars represent.`,
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
