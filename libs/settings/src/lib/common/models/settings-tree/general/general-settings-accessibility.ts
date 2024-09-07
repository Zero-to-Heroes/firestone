import { SettingContext, SettingNode } from '../../settings.types';

export const generalAccessibilitySettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-accessibility',
		name: context.i18n.translateString('settings.general.launch.accessibility-title'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'general-accessibility',
				title: context.i18n.translateString('settings.general.launch.accessibility-title'),
				settings: [
					{
						type: 'toggle',
						field: 'flashWindowOnYourTurn',
						label: context.i18n.translateString('settings.general.launch.flash-window'),
						tooltip: context.i18n.translateString('settings.general.launch.flash-window-tooltip'),
					},
					{
						type: 'slider',
						field: 'globalZoomLevel',
						label: context.i18n.translateString('settings.general.launch.zoom-level'),
						tooltip: context.i18n.translateString('settings.general.launch.zoom-level-tooltip'),
						sliderConfig: {
							min: 100,
							max: 400,
							snapSensitivity: 5,
							knobs: [
								{
									absoluteValue: 100,
									label: context.i18n.translateString('settings.global.knob-zoom.normal'),
								},
								{
									absoluteValue: 200,
									label: context.i18n.translateString('settings.global.knob-zoom.zoom-200'),
								},
								{
									absoluteValue: 400,
									label: context.i18n.translateString('settings.global.knob-zoom.zoom-400'),
								},
							],
						},
					},
				],
			},
		],
	};
};
