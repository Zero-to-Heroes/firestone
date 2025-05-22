import { CONSTRUCTED_DISCOVERS_DAILY_FREE_USES, Preferences } from '@firestone/shared/common/service';
import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs } from '../common';

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
					{
						type: 'toggle',
						field: 'decktrackerShowMinionPlayOrderOnBoard',
						label: context.i18n.translateString('settings.decktracker.global.minions-play-order'),
						tooltip: context.i18n.translateString('settings.decktracker.global.minions-play-order-tooltip'),
					},
				],
			},
			{
				id: 'decktracker-global-counters',
				title: null,
				settings: [
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
