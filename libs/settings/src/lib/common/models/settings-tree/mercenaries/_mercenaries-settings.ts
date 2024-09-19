import { SettingContext, SettingNode } from '../../settings.types';
import { mercenariesGeneralSettings } from './mercenaries-settings-general';

export const mercenariesSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'mercenaries-root',
		name: context.i18n.translateString('settings.menu.mercenaries'),
		keywords: null,
		children: [mercenariesGeneralSettings(context)],
	};
};
