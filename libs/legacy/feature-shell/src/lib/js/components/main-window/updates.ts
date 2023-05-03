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
		version: '11.1.0',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `This version introduces the Firestone Premium Users rework. You can read all the details (including the list of features that are Premium-exclusive) <a href="https://github.com/Zero-to-Heroes/firestone/wiki/Premium-vs-ads" target="_blank">on the wiki</a>, but the TL;DR is:
			// 	<ul>
			// 	<li>The Premium subscription is now $5 / month</li>
			// 	<li>There is a new ad space for free users</li>
			// 	<li>A few of the app's features are now premium-exclusive</li>
			// 	</ul>
			// 	While I would have loved to keep everything free and continue with the previous business model, I think that the current compromise is not too bad. Most of the information that used to be available for free can still be seen it via other (though less convenient) means directly from the app as well. As for the information that is now exclusive to premium users, I feel that it's usually not vital information, but rather nice-to-have bonuses (like the cards history).
			// 	<p>
			// 	As usual, I'm open to feedback, so let me know what you think on Discord!
			// 	`,
			// },
			// {
			// 	type: 'main',
			// 	header: 'Main updates',
			// 	updates: [
			// 		{
			// 			category: 'general',
			// 			details: [
			// 				{
			// 					type: 'feature',
			// 					text: `(PREMIUM) The firestoneapp.gg website has been updated with momre Duels stats and filters. The Battlegrounds section now shows which tribes have the best impact on each hero's average position.`,
			// 				},
			// 			],
			// 		},
			// 	],
			// },
			{
				type: 'minor',
				header: 'Minor updates',
				updates: [
					{
						category: 'decktracker',
						details: [
							{
								type: 'content',
								text: `Add new oracles and card highlights.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Grand Totem Eys'Or's effect was not being added to the Global Effects list.`,
							},
							{
								type: 'bug',
								text: `Fix oracles for Melomania and Fight Over Me.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue where Leapfrogger could not buff itself when triggered by Macaw.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the decklists shown in the app would not have the cards ordered alphabetically for a given mana cost.`,
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
