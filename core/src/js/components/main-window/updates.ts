export interface Update {
	readonly sections: readonly UpdateSection[];
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
		version: '8.0.15',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					There are still some issues here and there with mercenaries (the replays don't show up immediately for instance, the replay viewer should probably be deactivated for Mercenaries games, etc.), and all of these will be fixed over the coming days. Have fun!
				`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'mercenaries',
						details: [
							{
								type: 'feature',
								text: `Adds a battle team widget for the player.`,
							},
							{
								type: 'feature',
								text: `The battle team widget now tracks how many times each ability has been used and the current cooldown left on each.`,
							},
							{
								type: 'feature',
								text: `A button as been added at the bottom of the team widget to show a recap of the roles chart (what roles does double damage to what other role). Like everything else, there is a setting to disable it if you don't want/need it.`,
							},
							{
								type: 'feature',
								text: `Adds a team widget on the bounty map (useful to easily get acces to your team when deciding on a path or picking a treasure).`,
							},
							{
								type: 'feature',
								text: `Mousing over an ability (in the team widget) or a treasure (in the treasure selection screen) now highlights its synergies (for instance, mousing over Banner of the Horde highlights all Horde mercenaries in your team)`,
							},
							{
								type: 'ui',
								text: `Improve how Mercenaries match look in the Replays tab.`,
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
						category: 'mercenaries',
						details: [
							{
								type: 'ui',
								text: `Show max level abilities by default in the battle team widget (and when the opponent actually uses one ability, the real level is used instead).`,
							},
							{
								type: 'ui',
								text: `Show each mercenary's current treasures in the team widget.`,
							},
							{
								type: 'ui',
								text: `Dead mercenaries are now dimmed in the team widget.`,
							},
							{
								type: 'ui',
								text: `Show 'Unknown mercenary' instead of a blank line when playing PvP in the team widget.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'feature',
								text: `Add Mercenary (PvP) and Mercenary (PvE) filters.`,
							},
						],
					},
				],
			},
			// {
			// 	type: 'future',
			// 	header: 'Under the Hood',
			// 	text: `

			// 	`,
			// },
		],
	},
];
