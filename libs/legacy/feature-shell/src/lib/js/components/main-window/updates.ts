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
		version: '11.5.5',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `The last patch has been more bumpy than I expected. If you find that the app doesn't track your games properly, please first try restarting Hearthstone, and see if the problem persists. Thanks again for your patience and support!`,
			// },
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'achievements',
						details: [
							{
								type: 'feature',
								text: `You can now track live progress of achievements during the game! Just find the achievements you want to track from Firestone's Achievements tab, ping them, and you're set! You can also let the app pick 3 achievements for you to try and complete.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'misc',
								text: `A new Lottery season has started! Quilboars are now worth 10 points each. Results for the previous season have been posted on <a href="https://twitter.com/ZerotoHeroes_HS/status/1675769176424693772?s=20" target="_blank">Twitter</a> and <a href="https://discord.com/channels/187101197767933952/489517715376308244/1125327168076001341" target="_blank">Discord</a>. Good luck!`,
							},
							{
								type: 'bug',
								text: `Fixed a bug where sometimes the lottery widget wouldn't close properly.`,
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
								text: `Commander Sivara now won't remember their previous spells when bounced back to hand.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Menagerie counter would sometimes be slightly off.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue with Bristleback Knight.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `You can now filter to show all Twist sets.`,
							},
							{
								type: 'feature',
								text: `(Premium) The cards history is now linked to the sets that are currently visible on the main screen. This means that you can go into a specific set and see all the history for that set. `,
							},
							{
								type: 'feature',
								text: `(Premium) You can now view aggregated stats for standard/twist/wild/all sets.`,
							},
						],
					},
					{
						category: 'achievements',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where achievements would sometimes not be properly sorted by completion date.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the "don't show me again" button on the lottery window notification wouldn't actually stop showing you notifications.`,
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
