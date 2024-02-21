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
		version: '13.5.12',
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
								text: `You can now browse the stats for the Quests and Rewards in the app (it's back on again!).`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Constructed meta stats (decks and archetypes) should be working once again.`,
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
								text: `Update the contents of Harth Stonebrew's hands following the 28.6.1 server-side hotfix. I'm still missing an updated version for Blood DK, Unholy DK and Paladin, so please send a screenshot my way if you have one :)`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the opponent's hand markers would display incorrect information after playing some of the cards created by Harth Stonebrew.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the opponent's corpse counter would not appear.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the position from the bottom after dredging would sometimes be incorrect.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Add a slider to resize the Quests Overlay (under Settings > Battlegrounds > Overlay, at the bottom).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the toggle for the Quests Overlay would not work properly.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Titus would apply its effect to entities that died at the same time as it.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where hero powers with Avenge effects would sometimes not trigger.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where quests could get completed during a battle.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Golden Mad Matador would only trigger once.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue with Goldrinn + Titus.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Yrel's power could not prevent minions from dying.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Boon of Beetles' enchantment could be applied twice.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where the timing for Assemble the Lineup was incorrect, causing issues with Scallywag's Sky Pirate token.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where auras would not be applied properly to the minion summoned by Rapid Reanimation.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where deathrattles would not progress their related quests.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Mystic Sporebat was considered Avenge instead of Deathrattle.`,
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
