import { SettingContext, SettingNode } from '../../settings.types';
import { generalDiscordSettings } from './general-settings-discord';
import { generalThirdPartiesSettings } from './general-settings-third-parties';
import { generalTwitchSettings } from './general-settings-twitch';

export const integrationsSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'integrations-root',
		name: context.i18n.translateString('settings.menu.integrations'),
		keywords: null,
		children: [
			generalThirdPartiesSettings(context),
			generalTwitchSettings(context),
			generalDiscordSettings(context),
		],
	};
};
