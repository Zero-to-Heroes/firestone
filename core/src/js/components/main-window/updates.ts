export interface Update {
	readonly sections: readonly UpdateSection[];
	readonly version: string;
}

export interface UpdateSection {
	readonly type: 'intro' | 'main' | 'minor' | 'beta';
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
		| 'decktracker'
		| 'battlegrounds'
		| 'collection';
	readonly details: UpdateSectionItemDetails[];
}

export interface UpdateSectionItemDetails {
	readonly type: 'feature' | 'bug' | 'ui' | 'content';
	readonly text: string;
}

export const updates: readonly Update[] = [
	{
		version: '6.2.39',
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `
					This new update finally gives me a way to talk to you more directly and inform you in-app of all the new stuff that comes with each new release. So please find below all the main updates, and if you're interested you can even dig deeper into the smaller items.
					<br/>
					And of course, feel free to reach out to me directly either on Discord or by submitting a bug/feedback (links are on the top bar above).
					<br/>
					<br/>
					
					And finally, I would like to thank you for using Firestone. It's thanks to you that the app can get where it is today, so thank you from the bottom of my heart.
					<br/>
					<br/>
					Take care,
					<br/>
					Seb.
				`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `The first version of the Duels tab is live! It gathers global and personal stats, recaps 
						your past runs, and showcases recent decks that ended at 12 wins.`,
							},
						],
					},
					{
						category: 'achievements',
						details: [
							{
								type: 'feature',
								text: `The new HS in-game (native) achievements can now be browsed inside Firestone. Also, a pop-up appears when a new native achievement is completed telling you what the achievement is about.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'ui',
								text: `Changed the color scheme to unify all game modes (Ladder, Battlegrounds, Duels) and get rid of the green color for replays.`,
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
								type: 'bug',
								text: `Golden Fish of N'Zoth is now properly handled by the simulator.`,
							},
							{
								type: 'bug',
								text: `If several Elistras are on the board, the simulator now always picks the first one to proc, instead of a random one.`,
							},
							{
								type: 'bug',
								text: `When filtering the MMR chart for the last patch, make the graph start at 0.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix an error being raised when the opponent buffs cards in hand with Don Han'Cho or Valanyr.`,
							},
							{
								type: 'bug',
								text: `If several Elistras are on the board, the simulator now always picks the first one to proc, instead of a random one.`,
							},
						],
					},
				],
			},
		],
	},
];
