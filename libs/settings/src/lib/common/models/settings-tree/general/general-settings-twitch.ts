import { SettingContext, SettingNode } from '../../settings.types';

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
