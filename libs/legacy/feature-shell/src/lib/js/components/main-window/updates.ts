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
		version: '10.3.14',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `IMPORTANT: Premium accounts are undergoing some changes, and some features are moving to be premium-only. You can read more about it <a href="https://github.com/Zero-to-Heroes/firestone/wiki/Premium-vs-ads" target="_blank">here</a>, but the TL;DR is:
			// 	<ul>
			// 		<li>The ads business model is showing its limits, and I need to change how the app generates revenues to be able to continue doing this full-time</li>
			// 		<li>Premium will move from $3-remove-the-ads to $5-remove-the-ads-and-get-more-features. The change in price will be in effect starting next week.</li>
			// 		<li>As much as possible, pure / low-processed data will be free. Premium features will be QoL and stuff that require a lot of processing</li>
			// 	</ul>
			// 	This is still experimental, so let me know what you think!<br/>
			// 	(PS: This message exceptionnaly ignores your "don't show me release notes" setting because I wanted to be sure that you all got the message)
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
								type: 'bug',
								text: `Fix an issue where the app would not start for some users.`,
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
								text: `Add an option to show a notification when a BG game ends to quickly view your game's stats.`,
							},
							{
								type: 'feature',
								text: `Add a way to show buddies when selecting minions in the simulator.`,
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
