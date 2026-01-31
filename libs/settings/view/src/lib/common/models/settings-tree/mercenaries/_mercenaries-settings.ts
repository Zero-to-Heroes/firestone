import { SettingContext, SettingNode } from '@firestone/settings/services';
import { mercenariesGeneralSettings } from './mercenaries-settings-general';

export const mercenariesSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'mercenaries-root',
		name: context.i18n.translateString('settings.menu.mercenaries'),
		keywords: null,
		children: [mercenariesGeneralSettings(context)],
	};
};
