export interface Update {
	readonly sections: readonly UpdateSection[];
	readonly version: string;
}

export interface UpdateSection {
	readonly type: 'main' | 'minor' | 'beta';
	readonly header: string;
	readonly updates: readonly UpdateSectionItem[];
}

export interface UpdateSectionItem {
	readonly category: 'app' | 'duels' | 'tracker' | 'battlegrounds';
	readonly type: 'feature' | 'bug' | 'content';
	readonly text: string;
}

export const updates: readonly Update[] = [
	{
		version: '6.2.9',
		sections: [
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'duels',
						type: 'feature',
						text: `The first version of the Duels tab is live! It gathers global and personal stats, recaps 
						your past runs, and showcases recent decks that ended at 12 wins.`,
					},
					{
						category: 'app',
						type: 'feature',
						text: `A notification now pops up after each match to show you how much XP was gained, and recaps
					your current progress towards the next level. You can deactivate it via the settings.`,
					},
				],
			},
		],
	},
];
