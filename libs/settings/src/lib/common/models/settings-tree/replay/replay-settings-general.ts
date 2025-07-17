import { SettingContext, SettingNode } from '../../settings.types';

export const replayGeneralSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'replay-general',
		name: context.i18n.translateString('settings.replay.menu.general'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'replay-general',
				title: context.i18n.translateString('settings.replay.menu.general'),
				settings: [
					{
						type: 'toggle',
						field: 'replaysHideGamesVsAi',
						label: context.i18n.translateString('settings.replay.general.hide-games-vs-ai'),
						tooltip: context.i18n.translateString('settings.replay.general.hide-games-vs-ai-tooltip'),
					},
				],
			},
		],
	};
};
