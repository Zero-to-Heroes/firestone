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
		version: '13.0.0',
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
						category: 'arena',
						details: [
							{
								type: 'feature',
								text: `Added a "Card Stats" tab. For now I'm only showing the "Drawn winrate" stat, which is probably the one that is the most correlated to how strong a card is, and will be useful to display in the overlay during the draft picks. That said, let me know if you're interested in seeing other stats on this tab :)`,
							},
							{
								type: 'feature',
								text: `Premium users can now see the card stats directly as an overlay while drafting (for now, this includes the Drawn Winrate, and will probably evolve to include more stats in the future). The first pick of each draft is free for all users though :)`,
							},
							{
								type: 'feature',
								text: `You can now see the synergies each option of the draft has with your deck, simply by mousing over each card. If you're played Duels with Firestone before, it works the exact same way as the Treasures synergies highlights.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix an info leak where Tradeable cards traded back to deck would be revealed when drawn.`,
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
								text: `The fake burned cards created by Symphony of Sins won't appear anymore.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where playing a Chaotic Tendril with Brann in play would only increment the counter once.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where holy secrets / quests / sigils / auras (like Crusader's Aura) would not count towards the cost reduction for Garden's Grace.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some card images would not show properly on the opponent's hand.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'content',
								text: `Remove Treasure-Seeker Elise from the minions list when playing with the Value Inflation anomaly.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Argent Braggart would not appear in the Tier 7 minions list.`,
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
