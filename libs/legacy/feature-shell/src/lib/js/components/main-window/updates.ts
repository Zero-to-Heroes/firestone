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
		version: '11.0.19',
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
								type: 'content',
								text: `Firestone has been updated for Festival of Legends. There are still a few of the new cards that need some additional support, so expect another update soon.`,
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
								type: 'content',
								text: `The tracker has been updated to show you known information in the opponent's hand for various cards like Power Chord: Synchronize, Fight Over Me, Fizzle's Snapshot, Merch Seller, Kangor Dancing King, Inifitize the Maxitude.`,
							},
							{
								type: 'content',
								text: `Card highlights added for Fizzle's Snapshot (when you play it) and Mixtape.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the "copy deck" button wouldn't work in the Constructed Deckbuilder`,
							},
							{
								type: 'misc',
								text: `I have done a big internal refactoring in how card highlighting works. This should let me more easily handle more complex cases (like Mixtape) and should make it way easier to support showing related cards (like Tess and Contraband Stash) when not using the Modern Tracker UI.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Fix a sim issue where Ghastcoiler could never spawn tribeless minions like Leeroy.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'feature',
								text: `When building a deck, buckets now won't show cards that are not eligible (e.g. different class).`,
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
