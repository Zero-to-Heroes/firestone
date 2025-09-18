import { SettingContext, SettingNode } from '../../settings.types';

export const generalAppearanceSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-appearance',
		name: context.i18n.translateString('settings.general.menu.appearance'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'decktracker-appearance',
				title: context.i18n.translateString('settings.general.appearance.decktracker.title'),
				settings: [
					{
						type: 'toggle',
						field: 'collectionUseHighResImages',
						label: context.i18n.translateString('settings.collection.general.high-resolution-images-label'),
						tooltip: null,
					},
					{
						type: 'toggle',
						field: 'useNewCardTileStyle',
						label: context.i18n.translateString('settings.general.appearance.decktracker.use-new-card-tile-style'),
						tooltip: context.i18n.translateString('settings.general.appearance.decktracker.use-new-card-tile-style-tooltip'),
					},
				],
			},
			{
				id: 'general-appearance',
				componentType: 'AppearanceCustomizationPageComponent',
			},
		],
	};
};
