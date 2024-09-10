import { SettingContext, SettingNode } from '../../settings.types';

export const generalAppearanceSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-appearance',
		name: context.i18n.translateString('settings.general.menu.appearance'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'general-appearance',
				componentType: 'AppearanceCustomizationPageComponent',
			},
		],
	};
};
