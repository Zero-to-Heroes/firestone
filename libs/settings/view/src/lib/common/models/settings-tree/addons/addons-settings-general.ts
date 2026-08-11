import { SettingContext, SettingNode } from '@firestone/settings/services';

export const generalAddonsSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'addons-general',
		name: context.i18n.translateString('settings.general.addons.title'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'addons-general',
				componentType: 'SettingsGeneralAddonsComponent',
			},
		],
	};
};
