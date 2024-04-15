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
		version: '13.10.6',
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
						category: 'general',
						details: [
							{
								type: 'misc',
								text: `The app's Main and Settings windows now fully close when you click on the "close" button. <br/> I have slightly changed how the Settings window and the app's Main window are loaded. Previously, when you closed one of these, it would simply get hidden, in order to bring it up faster the next time you asked for it. However, this led to some memory being used without any good reason, and so I've changed how they behave. Note that closing the app's main window with the Alt + C shortcut still simply hides it. Let me know what you think!`,
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
						category: 'general',
						details: [
							{
								type: 'misc',
								text: `I'm still fixing the memory leaks of the app. It might take a week or so to address all the biggest ones, so please be patient with me :)`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Card highlights in the tracker can now highlight different conditions in different colors (like Blindeye Sharpshooter highlights Nagas and Spells differently). Let me know if you encounter cards that could benefit from that!.`,
							},
							{
								type: 'feature',
								text: `Add a Dragons Summoned counter for the opponent. It only appears when the opponent is playing Priest and has summoned at least one dragon.`,
							},
							{
								type: 'feature',
								text: `Cards in the decklist will now be grouped based on whether or not the game itself consider them to be the same card (for instance, a Core and non-Core version of a card).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Turn Timer and Attack Counter would stop working after playing an additional turn from Zarimi.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where importing a deck code in the deck builder would not properly import sideboards.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `The "gold next turn" counter now accounts for your board, including "start of next turn" effects like Accord-o-Tron.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where sometimes highlights would be off, because Tavern Spells were ignored.`,
							},
							{
								type: 'bug',
								text: `Fix an issue in the simulator UI where you couldn't remove the "summon mechs" enchantment once added.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the rewards would mention "Gold Cards" instead of normal cards.`,
							},
						],
					},
					{
						category: 'achievements',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where Firestone achievements could not be completed anymore.`,
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
