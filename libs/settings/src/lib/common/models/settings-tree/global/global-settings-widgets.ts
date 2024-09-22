import { SettingContext, SettingNode } from '../../settings.types';

export const globalWidgetSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'global-widgets',
		name: context.i18n.translateString('settings.general.menu.widgets'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'global-widgets',
				title: context.i18n.translateString('settings.general.menu.widgets'),
				settings: [
					{
						// label: context.i18n.translateString('settings.decktracker.global.reset-button'),
						text: context.i18n.translateString('settings.decktracker.global.reset-button'),
						tooltip: context.i18n.translateString('settings.decktracker.global.reset-button-tooltip'),
						action: () => {
							context.prefs.resetDecktrackerPositions();
						},
						confirmation: context.i18n.translateString('settings.decktracker.global.reset-button-confirmation'),
					},
				],
			},
		],
	};
};
