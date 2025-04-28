import { Preferences } from '@firestone/shared/common/service';
import { DropdownOption, SettingContext, SettingNode } from '../../settings.types';

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
						type: 'dropdown',
						field: 'notificationsPosition',
						label: context.i18n.translateString('settings.general.launch.notifications-position-label'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.setAllNotifications,
						dropdownConfig: {
							options: [
								{
									value: 'bottom-right',
									label: context.i18n.translateString('settings.general.launch.notification-positions.bottom-right'),
								} as DropdownOption,
								{
									value: 'bottom-left',
									label: context.i18n.translateString('settings.general.launch.notification-positions.bottom-left'),
								} as DropdownOption,
								{
									value: 'top-right',
									label: context.i18n.translateString('settings.general.launch.notification-positions.top-right'),
								} as DropdownOption,
								{
									value: 'top-left',
									label: context.i18n.translateString('settings.general.launch.notification-positions.top-left'),
								} as DropdownOption,
							],
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
