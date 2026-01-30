import { SettingContext, SettingNode } from '../../settings.types';

export const generalModsSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'mods-general',
		name: context.i18n.translateString('settings.general.mods.title'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'mods-general',
				componentType: 'SettingsGeneralModsComponent',
			},
		],
	};
};
