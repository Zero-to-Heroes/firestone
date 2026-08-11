import { SettingContext, SettingNode } from '@firestone/settings/services';
import { generalAddonsSettings } from './addons-settings-general';

export const addonsSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'addons-root',
		name: context.i18n.translateString('settings.general.menu.addons'),
		keywords: null,
		children: [generalAddonsSettings(context)],
	};
};
