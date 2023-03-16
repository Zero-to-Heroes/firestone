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
		version: '10.3.11',
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
						category: 'decktracker',
						details: [
							{
								type: 'bug',
								text: `Fix an where the tracker could go crazy and stop updating properly in some cases.`,
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
								text: `The players' health in the Simulator tab (that shows a recap of past battles) now also includes their armor.`,
							},
							{
								type: 'bug',
								text: `Fix a sim issue where Ozumat's Tentacular would sometimes be summoned twice.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the hero's tooltip would spill out of the window when having it at its minimum size.`,
							},
						],
					},
					{
						category: 'replays',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where some filters (like the BG hero filter) would be taken into account even if the filter dropdown wasn't visible .`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the runs list would sometimes be empty until you played a Duels game.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'content',
								text: `A while ago, I introduced a new behavior to the main app's windows: if you had multiple monitors and the app's main window was open, the window would sometimes automatically move to another screen (to maximize "ad visibility", i.e. avoid showing ads on the window while it was hidden). This update didn't really improve this "ad visibility" metric, and was annoying, so I have reverted the behavior to how it was before.`,
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
