import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs } from '../common';

export const arenaGeneralSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'arena-general',
		name: context.i18n.translateString('settings.arena.menu.general'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'arena-general',
				title: context.i18n.translateString('settings.arena.menu.general'),
				settings: [
					{
						type: 'toggle',
						field: 'arenaShowHeroSelectionOverlay',
						label: context.i18n.translateString('settings.arena.general.show-hero-selection-overlay'),
						tooltip: context.i18n.translateString('settings.arena.general.show-hero-selection-overlay-tooltip'),
					},
					{
						type: 'toggle',
						field: 'arenaShowCardSelectionOverlay',
						label: context.i18n.translateString('settings.arena.general.show-card-selection-overlay'),
						tooltip: context.i18n.translateString('settings.arena.general.show-card-selection-overlay-tooltip'),
					},
					{
						type: 'toggle',
						field: 'arenaShowOocTracker',
						label: context.i18n.translateString('settings.arena.general.show-draft-tracker'),
						tooltip: context.i18n.translateString('settings.arena.general.show-draft-tracker-tooltip'),
					},
					{
						type: 'slider',
						field: 'arenaOocTrackerScale',
						label: context.i18n.translateString('settings.arena.general.tracker-size'),
						tooltip: null,
						sliderConfig: {
							min: 50,
							max: 150,
							snapSensitivity: 3,
							knobs: sizeKnobs(context),
						},
					},
					{
						type: 'slider',
						field: 'arenaDraftOverlayScale',
						label: context.i18n.translateString('settings.arena.general.draft-overlay-size'),
						tooltip: null,
						sliderConfig: {
							min: 50,
							max: 175,
							snapSensitivity: 3,
							knobs: sizeKnobs(context),
						},
					},
				],
			},
		],
	};
};
