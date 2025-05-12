import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs } from '../common';

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
						type: 'slider',
						field: 'globalWidgetScale',
						label: context.i18n.translateString('settings.general.widgets.size'),
						tooltip: context.i18n.translateString('settings.general.widgets.size-tooltip'),
						sliderConfig: {
							min: 30,
							max: 200,
							snapSensitivity: 5,
							knobs: sizeKnobs(context),
						},
					},
					{
						type: 'slider',
						field: 'globalWidgetOpacity',
						label: context.i18n.translateString('settings.general.widgets.counters-opacity'),
						tooltip: context.i18n.translateString('settings.general.widgets.counters-opacity-tooltip'),
						sliderConfig: {
							min: 40,
							max: 100,
							snapSensitivity: 3,
						},
					},
					{
						type: 'slider',
						field: 'cardTooltipScale',
						label: context.i18n.translateString('settings.general.widgets.card-tooltip-size'),
						tooltip: null,
						sliderConfig: {
							min: 30,
							max: 200,
							snapSensitivity: 5,
							knobs: sizeKnobs(context),
						},
					},
					{
						type: 'toggle',
						field: 'lockWidgetPositions',
						label: context.i18n.translateString('settings.general.widgets.lock-widgets-label'),
						tooltip: context.i18n.translateString('settings.general.widgets.lock-widgets-tooltip'),
					},
					{
						// label: context.i18n.translateString('settings.decktracker.global.reset-button'),
						text: context.i18n.translateString('settings.decktracker.global.reset-button'),
						tooltip: context.i18n.translateString('settings.decktracker.global.reset-button-tooltip'),
						keywords: [context.i18n.translateString('settings.decktracker.global.reset-button')],
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
