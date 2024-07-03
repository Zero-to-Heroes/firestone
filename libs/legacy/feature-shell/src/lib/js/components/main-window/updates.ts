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
		version: '13.18.2',
		force: false,
		sections: [
			// {
			// 	type: 'intro',
			// 	header: 'Message from the dev',
			// 	text: `IMPORTANT: some people have reported app crashes since the latest updates. The reports for now have all been on Battlegrounds, so I'm disabling the new Quests live stats for now. Please let me know if this improves the situation for you (you can reach out on Discord: https://discord.gg/vKeB3gnKTy or by using the "Report a bug" feature at the top right of the app's main window).
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
								text: `A very first version of the Guilds feature is now available! They will allow you to share all kind of things Hearthston-related with your friends or communities. This first version adds a shared leaderboard for all game modes, and more things are planned for the future (let me know what you'd like to see!). Please note that guild creation is not yet publicly available, and is for now reserved to streamers who contact me directly on Discord.  <br/> The goal is to first see what are the features that click with the community, and then open it up to everyone.`,
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
								text: `Flint Firearm now shows all Quickdraw cards you can get on mouse over. This new piece of tech will let me display dynamic card pools for other cards, so let me know which ones you'd like to see!`,
							},
							{
								type: 'feature',
								text: `Cards received from Repackaged Box are now flagged in hand.`,
							},
							{
								type: 'feature',
								text: `Add the new opponent decks in Twist.`,
							},
							{
								type: 'bug',
								text: `Fix an issue that would show incorrect cards as being in your opponent's deck when using the Legacy Tracker mode.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where secrets replayed by Tess (and probably Yogg) would not be flagged as gifts.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some cards like Tess would show incorrect information after playing a hero card and changing classes.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where some card tooltips would suddenly become empty.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where card highlight for Lady Liadrin would also include spells played on non-friendly characters.`,
							},
						],
					},
					{
						category: 'battlegrounds',
						details: [
							{
								type: 'bug',
								text: `Only show Disguised Graverobber in the minions list when Undead are in.`,
							},
							{
								type: 'bug',
								text: `Fix an issue where the opponnet's boards were not always properly detected when facing the ghosts in Duos.`,
							},
							{
								type: 'bug',
								text: `Fix multiple simulation issues.`,
							},
						],
					},
					{
						category: 'arena',
						details: [
							{
								type: 'bug',
								text: `Fix an issue where a lot of match-related data points were missing from the card stats, like mulligan winrate.`,
							},
						],
					},
					{
						category: 'duels',
						details: [
							{
								type: 'misc',
								text: `At long last, it's time to let Duels go. This was a really fun mode, and I'm glad I could help so many of you with your runs. But it's time to move on to other things. The Duels entry in the menu has finally been removed.`,
							},
						],
					},
					{
						category: 'general',
						details: [
							{
								type: 'misc',
								text: `Most images will now be streamed from the cloud instead of being embedded in the app. This reduces the download size of each update.`,
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
