import { ARENA_DISCOVERS_DAILY_FREE_USES } from '@firestone/arena/common';
import { Preferences } from '@firestone/shared/common/service';
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
						field: 'arenaShowMulliganCardImpact',
						label: context.i18n.translateString('settings.decktracker.mulligan.show-mulligan-card-impact-label'),
						tooltip: context.i18n.translateString('settings.decktracker.mulligan.show-mulligan-card-impact-tooltip'),
					},
					{
						type: 'toggle',
						field: 'arenaShowMulliganDeckOverview',
						label: context.i18n.translateString('settings.decktracker.mulligan.show-mulligan-deck-overview-label'),
						tooltip: context.i18n.translateString('settings.decktracker.mulligan.show-mulligan-deck-overview-tooltip'),
					},
					{
						type: 'toggle',
						field: 'hideMulliganWhenFriendsListIsOpen',
						label: context.i18n.translateString('settings.battlegrounds.session-widget.hide-when-friends-list-open'),
						tooltip: context.i18n.translateString('settings.battlegrounds.session-widget.hide-when-friends-list-open-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.arenaShowMulliganDeckOverview,
					},
					{
						type: 'toggle',
						field: 'arenaShowCardStatDuringDiscovers',
						label: context.i18n.translateString('settings.arena.general.show-card-stats-discover'),
						tooltip: context.i18n.translateString('settings.arena.general.show-card-stats-discover-tooltip', {
							freeUses: ARENA_DISCOVERS_DAILY_FREE_USES,
						}),
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
