import { SettingContext, SettingNode } from '@firestone/settings/services';

export const generalDiscordSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-discord',
		name: context.i18n.translateString('settings.general.menu.discord'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'general-discord',
				componentType: 'SettingsDiscordComponent',
			},
		],
	};
};
