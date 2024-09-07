import { SettingContext, SettingNode } from '../../settings.types';

export const generalGeneralSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-general',
		name: context.i18n.translateString('settings.general.menu.general'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'general-launch',
				title: context.i18n.translateString('settings.general.launch.title'),
				settings: [
					{
						type: 'toggle',
						field: 'launchAppOnGameStart',
						label: 'settings.general.launch.launch-on-game-start-label',
						tooltip: 'settings.general.launch.launch-on-game-start-tooltip',
						advancedSetting: true,
					},
					{
						type: 'toggle',
						field: 'collectionUseOverlay',
						label: 'settings.general.launch.integrated-mode-label',
						tooltip: 'settings.general.launch.integrated-mode-tooltip',
						toggleConfig: {
							toggleFunction: (context: SettingContext) => context.ow.getMainWindow().reloadWindows(),
						},
					},
				],
			},
		],
	};
};
