import { SettingContext, SettingNode } from '../../settings.types';

export const generalNotificationsSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-notifications',
		name: context.i18n.translateString('settings.general.notifications.title'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'general-notifications',
				title: context.i18n.translateString('settings.general.notifications.title'),
				settings: [
					{
						type: 'toggle',
						field: 'setAllNotifications',
						label: context.i18n.translateString('settings.general.launch.display-notifications-label'),
						tooltip: context.i18n.translateString('settings.general.launch.display-notifications-tooltip'),
						advancedSetting: true,
						toggleConfig: {
							messageWhenToggleValue: context.i18n.translateString('settings.general.launch.display-notifications-confirmation'),
							valueToDisplayMessageOn: false,
						},
					},
					{
						type: 'toggle',
						field: 'showXpRecapAtGameEnd',
						label: context.i18n.translateString('settings.general.launch.xp-recap-on-game-end-label'),
						tooltip: context.i18n.translateString('settings.general.launch.xp-recap-on-game-end-tooltip'),
					},
				],
			},
		],
	};
};
