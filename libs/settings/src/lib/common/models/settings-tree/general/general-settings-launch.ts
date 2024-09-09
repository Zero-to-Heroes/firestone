import { SettingContext, SettingNode } from '../../settings.types';

export const generalLaunchSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-launch',
		name: context.i18n.translateString('settings.general.launch.title'),
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
						label: context.i18n.translateString('settings.general.launch.launch-on-game-start-label'),
						tooltip: context.i18n.translateString('settings.general.launch.launch-on-game-start-tooltip'),
						advancedSetting: true,
					},
					{
						type: 'toggle',
						field: 'collectionUseOverlay',
						label: context.i18n.translateString('settings.general.launch.integrated-mode-label'),
						tooltip: context.i18n.translateString('settings.general.launch.integrated-mode-tooltip'),
						toggleConfig: {
							toggleFunction: (newValue: boolean) => context.ow.getMainWindow().reloadWindows(),
						},
					},
					{
						type: 'toggle',
						field: 'showSessionRecapOnExit',
						label: context.i18n.translateString('settings.general.launch.session-recap-on-exit-label'),
						tooltip: context.i18n.translateString('settings.general.launch.session-recap-on-exit-tooltip'),
					},
					{
						type: 'toggle',
						field: 'dontShowNewVersionNotif',
						label: context.i18n.translateString('settings.general.launch.hide-release-notes-label'),
						tooltip: context.i18n.translateString('settings.general.launch.hide-release-notes-tooltip'),
					},
				],
			},
		],
	};
};
