import { Preferences } from '@firestone/shared/common/service';
import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs } from '../common';

export const battlegroundsBannedTribesSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'battlegrounds-tribes',
		name: context.i18n.translateString('settings.battlegrounds.menu.tribes'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'battlegrounds-banned-tribes-overlay',
				title: context.i18n.translateString('settings.battlegrounds.overlay.overlay-title'),
				settings: [
					{
						type: 'toggle',
						field: 'bgsShowBannedTribesOverlay',
						label: context.i18n.translateString('settings.battlegrounds.overlay.show-banned-tribes-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.show-banned-tribes-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
					},
					{
						type: 'toggle',
						field: 'bgsBannedTribesShowVertically',
						label: context.i18n.translateString('settings.battlegrounds.overlay.banned-tribes-show-in-column-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.banned-tribes-show-in-column-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsShowBannedTribesOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsUseBannedTribeColors',
						label: context.i18n.translateString('settings.battlegrounds.overlay.show-tribe-colors-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.show-tribe-colors-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsShowBannedTribesOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsShowAvailableTribesOverlay',
						label: context.i18n.translateString('settings.battlegrounds.overlay.show-available-tribes-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.show-available-tribes-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsShowBannedTribesOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsTribesOverlaySingleRow',
						label: context.i18n.translateString('settings.battlegrounds.overlay.banned-tribes-single-row-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.banned-tribes-single-row-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsShowBannedTribesOverlay,
					},
					{
						type: 'slider',
						field: 'bgsBannedTribeScale',
						label: context.i18n.translateString('settings.battlegrounds.overlay.banned-tribes-icon-size-label'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsShowBannedTribesOverlay,
						sliderConfig: {
							min: 80,
							max: 135,
							snapSensitivity: 3,
							knobs: sizeKnobs(context),
						},
					},
				],
			},
		],
	};
};
