import { Preferences } from '@firestone/shared/common/service';
import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs } from '../common';

export const decktrackerLobbySettings = (context: SettingContext): SettingNode => {
	return {
		id: 'decktracker-lobby',
		name: context.i18n.translateString('settings.decktracker.menu.lobby'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'decktracker-lobby',
				title: context.i18n.translateString('settings.decktracker.lobby.title'),
				settings: [
					{
						type: 'toggle',
						field: 'constructedShowOocTracker',
						label: context.i18n.translateString('settings.decktracker.lobby.show-lobby-tracker'),
						tooltip: context.i18n.translateString('settings.decktracker.lobby.show-lobby-tracker-tooltip'),
					},
					{
						type: 'slider',
						field: 'constructedOocTrackerScale',
						label: context.i18n.translateString('settings.arena.general.tracker-size'),
						disabledIf: (prefs: Preferences) => !prefs?.constructedShowOocTracker,
						tooltip: null,
						sliderConfig: {
							min: 50,
							max: 150,
							snapSensitivity: 3,
							knobs: sizeKnobs(context),
						},
					},
				],
			},
		],
	};
};
