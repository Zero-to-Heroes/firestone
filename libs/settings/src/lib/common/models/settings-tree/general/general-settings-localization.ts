import { DropdownOption, SettingContext, SettingNode } from '../../settings.types';

export const generalLocalizationSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-localization',
		name: context.i18n.translateString('settings.general.menu.localization'),
		cssClass: 'general-localization',
		keywords: null,
		children: null,
		sections: [
			{
				id: 'general-localization',
				title: context.i18n.translateString('settings.general.menu.localization'),
				texts: [
					context.i18n.translateString('settings.general.localization.text-1'),
					context.i18n.translateString('settings.general.localization.text-11'),
					getText2(context),
					context.i18n.translateString('settings.general.localization.text-3'),
				],
				settings: [
					{
						type: 'dropdown',
						field: 'locale',
						label: null,
						tooltip: null,
						dropdownConfig: {
							options: options,
							afterSelection: (newLocale: string) => {
								context.i18n.setLocale(newLocale);
							},
						},
					},
				],
			},
		],
	};
};

const getText2 = (context: SettingContext) => {
	const link = context.i18n.translateString('settings.general.localization.link');
	return context.i18n.translateString('settings.general.localization.text-2', {
		link: `<a href="https://github.com/Zero-to-Heroes/firestone-translations/blob/main/README.md" target="_blank">${link}</a>`,
	});
};

const options = [
	{
		value: 'deDE',
		label: 'Deutsch',
	} as DropdownOption,
	{
		value: 'enUS',
		label: 'English',
	} as DropdownOption,
	{
		value: 'esES',
		label: 'Espa\u00f1ol (EU)',
	} as DropdownOption,
	{
		value: 'esMX',
		label: 'Espa\u00f1ol (AL)',
	} as DropdownOption,
	{
		value: 'frFR',
		label: 'Fran\u00e7ais',
	} as DropdownOption,
	{
		value: 'itIT',
		label: 'Italiano',
	} as DropdownOption,
	{
		value: 'jaJP',
		label: '\u65e5\u672c\u8a9e',
	} as DropdownOption,
	{
		value: 'koKR',
		label: '\ud55c\uad6d\uc5b4',
	} as DropdownOption,
	{
		value: 'plPL',
		label: 'Polski',
	} as DropdownOption,
	{
		value: 'ptBR',
		label: 'Portugu\u00eas (BR)',
	} as DropdownOption,
	{
		value: 'ruRU',
		label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439',
	} as DropdownOption,
	{
		value: 'thTH',
		label: '\u0e44\u0e17\u0e22',
	} as DropdownOption,
	{
		value: 'zhCN',
		label: '\u7b80\u4f53\u4e2d\u6587',
	} as DropdownOption,
	{
		value: 'zhTW',
		label: '\u7e41\u9ad4\u4e2d\u6587',
	} as DropdownOption,
];
