import { Preferences } from '@firestone/shared/common/service';
import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs } from '../common';

export const decktrackerTurnTimerSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'decktracker-turn-timer',
		name: context.i18n.translateString('settings.decktracker.menu.turn-timer'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'decktracker-turn-timer',
				title: context.i18n.translateString('settings.decktracker.turn-timer.title'),
				settings: [
					{
						type: 'toggle',
						field: 'showTurnTimer',
						label: context.i18n.translateString('settings.decktracker.turn-timer.show-turn-timer-label'),
						tooltip: context.i18n.translateString('settings.decktracker.turn-timer.show-turn-timer-tooltip'),
					},
					{
						type: 'toggle',
						field: 'showTurnTimerMatchLength',
						label: context.i18n.translateString('settings.decktracker.turn-timer.show-turn-timer-match-length-label'),
						tooltip: context.i18n.translateString('settings.decktracker.turn-timer.show-turn-timer-match-length-tooltip'),
					},
					{
						type: 'slider',
						field: 'turnTimerWidgetScale',
						label: context.i18n.translateString('settings.decktracker.turn-timer.size-title'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.showTurnTimer,
						sliderConfig: {
							min: 60,
							max: 140,
							snapSensitivity: 5,
							knobs: sizeKnobs(context),
						},
					},
					{
						type: 'slider',
						field: 'turnTimerWidgetWidth',
						label: context.i18n.translateString('settings.decktracker.turn-timer.width-title'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.showTurnTimer,
						sliderConfig: {
							min: 100,
							max: 300,
							snapSensitivity: 5,
						},
					},
					{
						type: 'slider',
						field: 'turnTimerWidgetOpacity',
						label: context.i18n.translateString('settings.decktracker.turn-timer.opacity-title'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.showTurnTimer,
						sliderConfig: {
							min: 10,
							max: 100,
							snapSensitivity: 5,
						},
					},
				],
			},
		],
	};
};
