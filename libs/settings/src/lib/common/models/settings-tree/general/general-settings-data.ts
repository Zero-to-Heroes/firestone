import { SettingContext, SettingNode } from '../../settings.types';

export const generalDataSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-data',
		name: context.i18n.translateString('settings.general.menu.data'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'general-data',
				title: context.i18n.translateString('settings.general.menu.data'),
				settings: [
					{
						type: 'toggle',
						field: 'allowGamesShare',
						label: context.i18n.translateString('settings.general.launch.allow-games-share-label'),
						tooltip: context.i18n.translateString('settings.general.launch.allow-games-share-tooltip'),
					},
				],
			},
		],
	};
};
