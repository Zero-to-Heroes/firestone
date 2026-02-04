import { Setting, SettingButton, SettingContext, SettingNode } from '@firestone/settings/services';

export const generalAdminSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-admin',
		name: context.i18n.translateString('settings.general.menu.admin'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'general-admin',
				title: context.i18n.translateString('settings.general.menu.admin'),
				settings: [
					{
						label: context.i18n.translateString('settings.general.launch.reset-prefs-button-label'),
						text: context.i18n.translateString('settings.general.launch.reset-prefs-button-default'),
						tooltip: context.i18n.translateString('settings.general.launch.reset-prefs-tooltip'),
						confirmation: context.i18n.translateString('settings.general.launch.reset-prefs-button-confirmation'),
						action: async () => {
							await context.prefs.reset();
							context.services.settingsController.reloadWindows();
						},
					},
					{
						label: context.i18n.translateString('settings.general.launch.restart-app-button-label'),
						text: context.i18n.translateString('settings.general.launch.restart-app-button-text'),
						tooltip: null,
						action: async () => {
							context.services.settingsController.relaunchApp();
						},
					},
				].filter((s) => !!s) as readonly (Setting | SettingButton)[],
			},
		],
	};
};
