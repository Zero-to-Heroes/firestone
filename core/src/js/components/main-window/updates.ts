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
		version: '8.0.10',
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
								text: `Adds a team widget for the player.`,
							},
							{
								type: 'feature',
								text: `Adds a team widget on the bounty map (useful to easily get acces to your team when deciding on a path or picking a treasure).`,
							},
							{
								type: 'feature',
								text: `The team widget now tracks how many times each ability has been used and the current cooldown left on each.`,
							},
							{
								type: 'feature',
								text: `Show the list of known opponent mercenaries, as well as their abilities (shows the lvl 1 version of the ability if they haven't played it yet) and their equipment. It's still a very rought first version, but it gets the job done :)`,
							},
							{
								type: 'feature',
								text: `A very first Mercenaries tab has been created! You can see all available mercs & abilities, and stats (global + yours) will start appearing there soon.`,
							},
							{
								type: 'ui',
								text: `Improve how last Mercenaries match look in the Replays tab.`,
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
								text: `Highlight each mercenary's current treasures in the team widget.`,
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
