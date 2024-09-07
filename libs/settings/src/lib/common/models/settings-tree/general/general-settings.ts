import { SettingContext, SettingNode } from '../../settings.types';
import { generalGeneralSettings } from './general-settings-general';

export const generalSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-root',
		name: context.i18n.translateString('settings.menu.general'),
		keywords: null,
		children: [generalGeneralSettings(context)],
	};
};
