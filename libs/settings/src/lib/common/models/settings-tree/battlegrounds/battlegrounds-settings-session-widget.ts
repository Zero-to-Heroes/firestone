import { Preferences } from '@firestone/shared/common/service';
import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs } from '../common';

export const battlegroundsSessionWidgetSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'battlegrounds-session-widget',
		name: context.i18n.translateString('settings.battlegrounds.menu.session'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'battlegrounds-session-widget',
				title: context.i18n.translateString('settings.battlegrounds.session-widget.title'),
				settings: [
					{
						type: 'toggle',
						field: 'showCurrentSessionWidgetBgs',
						label: context.i18n.translateString('settings.battlegrounds.session-widget.label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.session-widget.label-tooltip'),
					},
					{
						type: 'toggle',
						field: 'sessionWidgetShowGroup',
						label: context.i18n.translateString('settings.battlegrounds.session-widget.show-groups'),
						tooltip: context.i18n.translateString('settings.battlegrounds.session-widget.show-groups-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.showCurrentSessionWidgetBgs,
					},
					{
						type: 'toggle',
						field: 'hideCurrentSessionWidgetWhenFriendsListIsOpen',
						label: context.i18n.translateString('settings.battlegrounds.session-widget.hide-when-friends-list-open'),
						tooltip: context.i18n.translateString('settings.battlegrounds.session-widget.hide-when-friends-list-open-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.showCurrentSessionWidgetBgs,
					},
					{
						type: 'toggle',
						field: 'sessionWidgetShowMatches',
						label: context.i18n.translateString('settings.battlegrounds.session-widget.show-matches'),
						tooltip: context.i18n.translateString('settings.battlegrounds.session-widget.show-matches-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.showCurrentSessionWidgetBgs,
					},
					{
						type: 'numeric-input',
						field: 'sessionWidgetNumberOfMatchesToShow',
						label: context.i18n.translateString('settings.battlegrounds.session-widget.number-of-matches'),
						tooltip: context.i18n.translateString('settings.battlegrounds.session-widget.number-of-matches-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.showCurrentSessionWidgetBgs || !prefs.sessionWidgetShowMatches,
						numericConfig: {
							minValue: 1,
							incrementStep: 1,
						},
					},
					{
						type: 'slider',
						field: 'sessionWidgetScale',
						label: context.i18n.translateString('settings.battlegrounds.session-widget.size-title'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.showCurrentSessionWidgetBgs,
						sliderConfig: {
							min: 60,
							max: 200,
							snapSensitivity: 3,
							knobs: sizeKnobs(context),
						},
					},
					{
						type: 'slider',
						field: 'sessionWidgetOpacity',
						label: context.i18n.translateString('settings.battlegrounds.session-widget.opacity-title'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.showCurrentSessionWidgetBgs,
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
