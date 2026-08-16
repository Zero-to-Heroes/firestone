import { SettingContext, SettingNode } from '@firestone/settings/services';
import { CONSTRUCTED_DISCOVERS_DAILY_FREE_USES, Preferences } from '@firestone/shared/common/service';
import { sizeKnobs, useGroupedCountersSetting } from '../common';

export const decktrackerOverlaysSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'decktracker-overlays',
		name: context.i18n.translateString('settings.decktracker.menu.overlay'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'decktracker-global-counters',
				title: null,
				settings: [
					{
						type: 'toggle',
						field: 'overlayEnableDiscoverHelp',
						label: context.i18n.translateString('settings.decktracker.global.discover-help'),
						tooltip: context.i18n.translateString('settings.decktracker.global.discover-help-tooltip'),
					},
					{
						type: 'toggle',
						field: 'constructedShowCardStatDuringDiscovers',
						label: context.i18n.translateString('settings.arena.general.show-card-stats-discover'),
						tooltip: context.i18n.translateString('settings.arena.general.show-card-stats-discover-tooltip', {
							freeUses: CONSTRUCTED_DISCOVERS_DAILY_FREE_USES,
						}),
						disabledIf: (prefs: Preferences) => !prefs.overlayEnableDiscoverHelp,
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
			{
				id: 'decktracker-play-order',
				title: context.i18n.translateString('settings.decktracker.global.play-order-title'),
				settings: [
					{
						type: 'toggle',
						field: 'decktrackerShowMinionPlayOrderOnBoard',
						label: context.i18n.translateString('settings.decktracker.global.minions-play-order'),
						tooltip: context.i18n.translateString('settings.decktracker.global.minions-play-order-tooltip'),
					},
					{
						type: 'toggle',
						field: 'decktrackerShowWeaponPlayOrderOnBoard',
						label: context.i18n.translateString('settings.decktracker.global.weapons-play-order'),
						tooltip: context.i18n.translateString('settings.decktracker.global.weapons-play-order-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.decktrackerShowMinionPlayOrderOnBoard && !prefs.decktrackerShowWeaponPlayOrderOnBoard,
					},
					{
						type: 'slider',
						field: 'decktrackerMinionPlayOrderOpacity',
						label: context.i18n.translateString('settings.decktracker.turn-timer.opacity-title'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.decktrackerShowMinionPlayOrderOnBoard && !prefs.decktrackerShowWeaponPlayOrderOnBoard,
						sliderConfig: {
							min: 0,
							max: 100,
							snapSensitivity: 5,
						},
					},
					{
						type: 'slider',
						field: 'decktrackerMinionPlayOrderScale',
						label: context.i18n.translateString('settings.decktracker.mulligan.size'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.decktrackerShowMinionPlayOrderOnBoard && !prefs.decktrackerShowWeaponPlayOrderOnBoard,
						sliderConfig: {
							min: 25,
							max: 175,
							snapSensitivity: 5,
							knobs: sizeKnobs(context),
						},
					},
				],
			},
			{
				id: 'decktracker-global-counters',
				title: null,
				settings: [
					useGroupedCountersSetting(context),
					{
						type: 'toggle',
						field: 'countersUseExpandedView',
						label: context.i18n.translateString('settings.decktracker.global.counters-use-expanded-view-label'),
						tooltip: context.i18n.translateString('settings.decktracker.global.counters-use-expanded-view-tooltip'),
					},
				],
			},
		],
	};
};
