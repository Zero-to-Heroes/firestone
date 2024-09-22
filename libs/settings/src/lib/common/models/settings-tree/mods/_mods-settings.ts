import { SettingContext, SettingNode } from '../../settings.types';
import { generalModsSettings } from './mods-settings-general';

export const modsSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'mods-root',
		name: context.i18n.translateString('settings.general.menu.mods'),
		keywords: null,
		children: [generalModsSettings(context)],
	};
};
