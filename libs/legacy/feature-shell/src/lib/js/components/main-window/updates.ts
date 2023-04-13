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
		version: '11.0.21',
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
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `(PREMIUM) The firestoneapp.gg website has been updated with some Duels stats. I'm still working on adding all the missing filters in Duels and BG there, and will start adding new features afterwards.`,
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
								text: `Fix an info leak that would reveal when your opponent drew a Symphony of Sins' movement.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where cards would sometimes not be highlighted properly.`,
							},
							{
								type: 'bug',
								text: `Tried to fix an issue where cards drawn by Finley would sometimes get icons (like Finley's icon, or the Coin).`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Add the "Warning" icon in the Simulator tab of the BG window when some boards are not supported (it was already showing on the overlay widget).`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where the rank filter had disappeared from the High-Wins deck tab.`,
							},
						],
					},
					{
						category: 'collection',
						details: [
							{
								type: 'feature',
								text: `Also add the card back description when mousing over card backs in the Collection tab (not localized yet).`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the Search field had become a premium-exclusive feature.`,
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
