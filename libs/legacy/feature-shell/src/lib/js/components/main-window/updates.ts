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
		version: '11.0.6',
		force: false,
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `This version introduces the Firestone Premium Users rework. You can read all the details (including the list of features that are Premium-exclusive) <a href="https://github.com/Zero-to-Heroes/firestone/wiki/Premium-vs-ads" target="_blank">on the wiki</a>, but the TL;DR is:
				<ul>
				<li>The Premium subscription is now $5 / month</li>
				<li>There is a new ad space for free users</li>
				<li>A few of the app's features are now premium-exclusive</li>
				</ul>
				While I would have loved to keep everything free and continue with the previous business model, I think that the current compromise is not too bad. Most of the information that used to be available for free can still be seen it via other (though less convenient) means directly from the app as well. As for the information that is now exclusive to premium users, I feel that it's usually not vital information, but rather nice-to-have bonuses (like the cards history).
				<p>
				As usual, I'm open to feedback, so let me know what you think on Discord!
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
								text: `Duels now has real tier lists for Heroes, Hero Powers, Signature Treasures, and Active and Passive Treasures.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `You can now see the strategy tips for each hero by mousing over the "click to view the tips" text in the BG window`,
							},
							{
								type: 'feature',
								text: `(PREMIUM) Premium users can also see this information directly in the overlay`,
							},
							{
								type: 'feature',
								text: `Your own buddy now appears in the minions list. This lets you check out its golden version easily`,
							},
							{
								type: 'feature',
								text: `If you're playing ETC Band Manager, a new "Buds" tier will appear in the bottom row of the minions list with all the Buddies that they can discover from.`,
							},
							{
								type: 'feature',
								text: `If you're playing Tess or Scabbs, a new "Buds" tier will appear in the bottom row of the minions list with the buddies from all the players in the lobby.`,
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
								text: `The "Simulate" button now changes text while the simulation is ongoing.`,
							},
							{
								type: 'feature',
								text: `Fix a simulator issue with Frostwolf Lieutenant.`,
							},
						],
					},
					{
						category: 'achievements',
						details: [
							{
								type: 'bug',
								text: `Fix an issue that would prevent the app from updating the in-game achievements progress.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'bug',
								text: `Fix the missing scrollbar in the Streams tab.`,
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
