import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs } from '../common';

export const globalStreamerSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'global-streamer',
		name: context.i18n.translateString('settings.general.menu.streamer'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'global-streamer',
				title: context.i18n.translateString('settings.general.menu.general'),
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
				id: 'global-streamer-battlegrounds',
				title: context.i18n.translateString('global.game-mode.battlegrounds'),
				settings: [
					{
						type: 'toggle',
						field: 'bgsShowAnomalyFullOverlay',
						label: context.i18n.translateString('settings.general.streamer.battlegrounds.show-full-anomaly-overlay'),
						tooltip: context.i18n.translateString('settings.general.streamer.battlegrounds.show-full-anomaly-overlay-tooltip'),
					},
					{
						type: 'slider',
						field: 'bgsAnomalyFullOverlayScale',
						label: context.i18n.translateString('settings.general.widgets.size'),
						tooltip: context.i18n.translateString('settings.general.widgets.size-tooltip'),
						sliderConfig: {
							min: 30,
							max: 200,
							snapSensitivity: 5,
							knobs: sizeKnobs(context),
						},
					},
				],
			},
		],
	};
};
