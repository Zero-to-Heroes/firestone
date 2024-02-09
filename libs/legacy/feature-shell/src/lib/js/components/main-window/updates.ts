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
		version: '13.4.4',
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
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `You can now view mulligan data for your deck directly in the overlay! Free users will be able to use this feature 3 times per day, while premium users will have unlimited access to it. Let me know if you have any feedback on this! (note: it will probably be deactivated when the app goes live, as I want to keep it a bit longer in beta for testing)`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'feature',
								text: `You can now see an overview of your Arena runs, including the decklist used and the picks made during the draft. Let me know if there are more things you'd like to see there!`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'misc',
								text: `I did some major rework of how games are uploaded. It should be transparent to you, but if you notice anything weird (replay not found, stats missing, etc.), please let me know!`,
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
								type: 'content',
								text: `Piloted Whirl-o-Tron is now supported in the simulator.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where battlecries that had no effects on the combat (tavern-only battlecries) would not trigger Kalecgos when triggered in combat (e.g. by Rylak).`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Fish of N'Zoth would sometimes spawn traitor minions that would attack their own warband.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add a setting to ignore the discard / burned / dead / etc. status when grouping cards with the same card ID.`,
							},
							{
								type: 'feature',
								text: `Don't show destroyed Locations as being in the Graveyard.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Fracking wouldn't draw from the bottom of the deck.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'feature',
								text: `Add a setting to change the size of the overlay while drafting.`,
							},
						],
					},
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Text search now also searches in the merc's faction.`,
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
