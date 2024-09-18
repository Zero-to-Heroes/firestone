import { SettingContext, SettingNode } from '../../settings.types';

export const decktrackerGlobalSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'decktracker-global',
		name: context.i18n.translateString('settings.decktracker.menu.global'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'decktracker-global',
				title: context.i18n.translateString('settings.decktracker.global.title'),
				settings: [
					{
						type: 'toggle',
						field: 'useStreamerMode',
						label: context.i18n.translateString('settings.decktracker.global.streamer-mode'),
						tooltip: context.i18n.translateString('settings.decktracker.global.streamer-mode-tooltip'),
					},
				],
			},
			{
				id: 'decktracker-global-features',
				title: null,
				settings: [
					{
						type: 'toggle',
						field: 'overlayShowTitleBar',
						label: context.i18n.translateString('settings.decktracker.global.show-title-bar'),
						tooltip: context.i18n.translateString('settings.decktracker.global.show-title-bar-tooltip'),
					},
				],
			},
		],
	};
};
