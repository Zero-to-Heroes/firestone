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
		version: '13.5.19',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `IMPORTANT: some people have reported app crashes since the latest updates. The reports for now have all been on Battlegrounds, so I'm disabling the new Quests live stats for now. Please let me know if this improves the situation for you (you can reach out on Discord: https://discord.gg/vKeB3gnKTy or by using the "Report a bug" feature at the top right of the app's main window).
			// 	`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Quest stats overlay is back! While it's a premium feature, free users can use it for two games every day (this might change in the future).`,
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
								text: `The "extra gold next turn" counter should now properly take into account cards that duplicate effects, like Brann or Brann's Blessings.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where a Venomous minion being deflected by Mad Matador would lose its Venomous charge.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Golden Deadstomper and Golden Zliza would give an incorrect buff.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Redemtpion would not handle auras from minions very well.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Emergent Flame's buff (triggered by Rylak) would not take into account the previous turn's refreshes.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Smoking Gun's buff would not be applied properly when received during the battle.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Sr Tomb Diver would always try to find a non-golden minion to target, instead of picking the rightmost one.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Beatboxer's enchantments would not be properly assigned.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add an "elemental streak" counter to keep track of how many turns in a row you played elementals.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the order of cards in the "Bottom of deck" section would be reversed after a Dredge.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where cards discovered from your own deck would be treated as a Dredge effect.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the app's main window would pop up when starting the game.`,
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
