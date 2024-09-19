import { SettingContext, SettingNode } from '../../settings.types';

export const decktrackerLaunchSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'decktracker-launch',
		name: context.i18n.translateString('settings.decktracker.menu.launch'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'decktracker-launch',
				title: context.i18n.translateString('settings.decktracker.modes.title'),
				settings: [
					{
						type: 'toggle',
						field: 'decktrackerShowRanked',
						label: context.i18n.translateString('settings.decktracker.modes.ranked'),
						tooltip: null,
					},
					{
						type: 'toggle',
						field: 'decktrackerShowDuels',
						label: context.i18n.translateString('settings.decktracker.modes.duels'),
						tooltip: null,
					},
					{
						type: 'toggle',
						field: 'decktrackerShowArena',
						label: context.i18n.translateString('settings.decktracker.modes.arena'),
						tooltip: null,
					},
					{
						type: 'toggle',
						field: 'decktrackerShowTavernBrawl',
						label: context.i18n.translateString('settings.decktracker.modes.tavern-brawl'),
						tooltip: null,
					},
					{
						type: 'toggle',
						field: 'decktrackerShowPractice',
						label: context.i18n.translateString('settings.decktracker.modes.practice'),
						tooltip: null,
					},
					{
						type: 'toggle',
						field: 'decktrackerShowFriendly',
						label: context.i18n.translateString('settings.decktracker.modes.friendly'),
						tooltip: null,
					},
					{
						type: 'toggle',
						field: 'decktrackerShowCasual',
						label: context.i18n.translateString('settings.decktracker.modes.casual'),
						tooltip: null,
					},
				],
			},
		],
	};
};
