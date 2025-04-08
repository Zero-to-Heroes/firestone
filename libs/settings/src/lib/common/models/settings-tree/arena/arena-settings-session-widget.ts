import { Preferences } from '@firestone/shared/common/service';
import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs } from '../common';

export const arenaSessionWidgetSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'arena-session-widget',
		name: context.i18n.translateString('settings.arena.session-widget.title'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'arena-session-widget',
				title: context.i18n.translateString('settings.arena.session-widget.title'),
				settings: [
					{
						type: 'toggle',
						field: 'arenaShowCurrentSessionWidget',
						label: context.i18n.translateString('settings.arena.session-widget.label'),
						tooltip: context.i18n.translateString('settings.arena.session-widget.label-tooltip'),
					},
					{
						type: 'toggle',
						field: 'arenaSessionWidgetShowGroup',
						label: context.i18n.translateString('settings.battlegrounds.session-widget.show-groups'),
						tooltip: context.i18n.translateString('settings.arena.session-widget.show-groups-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.arenaShowCurrentSessionWidget,
					},
					{
						type: 'toggle',
						field: 'arenaSessionWidgetShowMatches',
						label: context.i18n.translateString('settings.arena.session-widget.show-runs'),
						tooltip: context.i18n.translateString('settings.arena.session-widget.show-runs-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.arenaShowCurrentSessionWidget,
					},
					{
						type: 'numeric-input',
						field: 'arenaSessionWidgetNumberOfMatchesToShow',
						label: context.i18n.translateString('settings.arena.session-widget.number-of-runs'),
						tooltip: context.i18n.translateString('settings.arena.session-widget.number-of-runs-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.arenaShowCurrentSessionWidget || !prefs.arenaSessionWidgetShowMatches,
						numericConfig: {
							minValue: 1,
							incrementStep: 1,
						},
					},
					{
						type: 'slider',
						field: 'arenaSessionWidgetScale',
						label: context.i18n.translateString('settings.battlegrounds.session-widget.size-title'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.arenaShowCurrentSessionWidget,
						sliderConfig: {
							min: 60,
							max: 200,
							snapSensitivity: 3,
							knobs: sizeKnobs(context),
						},
					},
					{
						type: 'slider',
						field: 'arenaSessionWidgetOpacity',
						label: context.i18n.translateString('settings.battlegrounds.session-widget.opacity-title'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.arenaShowCurrentSessionWidget,
						sliderConfig: {
							min: 10,
							max: 100,
							snapSensitivity: 3,
						},
					},
				],
			},
		],
	};
};
