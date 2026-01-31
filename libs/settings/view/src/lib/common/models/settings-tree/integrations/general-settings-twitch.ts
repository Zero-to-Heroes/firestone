import { SettingContext, SettingNode } from '@firestone/settings/services';

export const generalTwitchSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-twitch',
		name: context.i18n.translateString('settings.general.menu.broadcast'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'general-twitch',
				componentType: 'SettingsBroadcastComponent',
			},
		],
	};
};
