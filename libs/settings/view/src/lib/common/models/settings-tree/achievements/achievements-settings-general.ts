import { Preferences } from '@firestone/shared/common/service';
import { SettingContext, SettingNode } from '../../settings.types';

export const achievementsGeneralSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'achievements-general',
		name: context.i18n.translateString('settings.achievements.menu.general'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'achievements-general',
				title: context.i18n.translateString('settings.achievements.menu.general'),
				settings: [
					{
						type: 'toggle',
						field: 'achievementsFullEnabled',
						label: context.i18n.translateString('settings.achievements.notifications.achievements-enabled-text'),
						tooltip: context.i18n.translateString('settings.achievements.notifications.achievements-enabled-tooltip'),
					},
					{
						type: 'toggle',
						field: 'showLottery',
						label: context.i18n.translateString('settings.achievements.notifications.achievements-live-tracking-text'),
						tooltip: context.i18n.translateString('settings.achievements.notifications.achievements-live-tracking-tooltip'),
					},
					{
						type: 'toggle',
						field: 'achievementsEnabled2',
						label: context.i18n.translateString('settings.achievements.notifications.firestone-achievements-text'),
						tooltip: context.i18n.translateString('settings.achievements.notifications.firestone-achievements-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.achievementsFullEnabled,
					},
					{
						type: 'toggle',
						field: 'achievementsDisplayNotifications2',
						label: context.i18n.translateString('settings.achievements.notifications.show-notifications-text'),
						tooltip: context.i18n.translateString('settings.achievements.notifications.show-notifications-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.achievementsFullEnabled,
					},
				],
			},
		],
	};
};
