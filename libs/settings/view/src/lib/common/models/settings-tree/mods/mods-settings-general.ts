import { SettingContext, SettingNode } from '@firestone/settings/services';

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
