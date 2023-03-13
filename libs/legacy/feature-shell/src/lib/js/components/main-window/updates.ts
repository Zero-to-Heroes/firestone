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
		version: '10.3.7',
		force: true,
		sections: [
			{
				type: 'intro',
				header: 'Message from the dev',
				text: `IMPORTANT: Premium accounts are undergoing some changes, and some features are moving to be premium-only. You can read more about it <a href="https://github.com/Zero-to-Heroes/firestone/wiki/Premium-vs-ads" target="_blank">here</a>, but the TL;DR is:
				<ul>
					<li>The ads business model is showing its limits, and I need to change how the app generates revenues to be able to continue doing this full-time</li>
					<li>Premium will move from $3-remove-the-ads to $5-remove-the-ads-and-get-more-features. The change in price will be in effect starting next week.</li>
					<li>As much as possible, pure / low-processed data will be free. Premium features will be QoL and stuff that require a lot of processing</li>
				</ul>
				This is still experimental, so let me know what you think!<br/>
				(PS: This message exceptionnaly ignores your "don't show me release notes" setting because I wanted to be sure that you all got the message)
				`,
			},
			{
				type: 'main',
				header: 'Main updates',
				updates: [
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'feature',
								text: `Strategy tips are here! Thanks to <a href="https://www.twitch.tv/rdulive" target="_blank">RDU</a> and the <a href="https://www.bgcurvesheet.com/" target="_blank">BG Curvesheet</a> for writing and sharing these tips! You can access them from the app's main window, or from the BG window while in-game`,
							},
							{
								type: 'feature',
								text: `[Premium] The strategy tips are now directly displayed when mousing over the hero portrait on the hero selection screen.`,
							},
							{
								type: 'content',
								text: `IMPORTANT: mousing over the hero portrait in the hero selection screen to show that hero's stats is now a premium-only feature. If you're not a Premium user, you can still bring up that data with the BG window (Alt + B).`,
							},
							{
								type: 'content',
								text: `IMPORTANT: same thing for showing the hero tier and average placement (and again, the info is available on the BG window).`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `You can now download your full game history from the Settings > General > Data tab, as well as modify how far back you wish the app to load your games. Beware though that loading your full history might take a while, depending on the amount of games you have.`,
							},
							{
								type: 'feature',
								text: `Your game history (as well as other data) is now cached on your disk, under %appData%\Overwolf\lnknbakkpommmjjdnelmfbjjdbocfpnpbkijjnob`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Add an icon to merge deck versions together. This is not a functional change, but it should make the deck merge feature easier to discover and understand.`,
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
								text: `The MMR graph (in the Rating tab) now doesn't always start at 0, and focuses more on the current rank.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue where Teron's Hero Power could cause the first attacker to be recomputed.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue where Amber Guardian could sometimes apply its buff twice.`,
							},
							{
								type: 'bug',
								text: `Fix a simulation issue where Sinrunner Blanchy's reborn would not trigger if killed by a poisonous minion.`,
							},
						],
					},
					{
						category: 'decktracker',
						details: [
							{
								type: 'feature',
								text: `Show the Volatile Skeleton counter in some cases when Xyrella is in the deck.`,
							},
							{
								type: 'feature',
								text: `Secrets created by Tear Reality now exclude Standard secrets.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Sir Finley would not remove cards at the bottom of the opponent's deck.`,
							},
							{
								type: 'bug',
								text: `The +X modifiers (for cards like Ignite) are now hidden when using the Legacy display mode (when Modern Tracker is turned off). They will be reintroduced later on once I'm able to properly do it in that display mode.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where Agony cards created in the opponent's deck would not be removed from their decklist.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'feature',
								text: `You can now reset the main window positions from the system tray icon. This should help for the rare case where some of these windows get moved outside of the screens.`,
							},
							{
								type: 'feature',
								text: `A few of the "past 100 days" filters have been renamed to "all time". They will work with all the data that the app has loaded, which is the past 100 days by default, but can be changed in the settings, under General > Data.`,
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
