import { SettingContext, SettingNode } from '@firestone/settings/services';
import { Preferences } from '@firestone/shared/common/service';
import { mulliganLingerOptions, mulliganPersonalMinGamesOptions, sizeKnobs } from '../common';

export const decktrackerMulliganSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'decktracker-mulligan',
		name: context.i18n.translateString('settings.decktracker.menu.mulligan'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'decktracker-mulligan',
				title: context.i18n.translateString('settings.decktracker.global.title'),
				settings: [
					{
						type: 'toggle',
						field: 'decktrackerShowMulliganCardImpact',
						label: context.i18n.translateString('settings.decktracker.mulligan.show-mulligan-card-impact-label'),
						tooltip: context.i18n.translateString('settings.decktracker.mulligan.show-mulligan-card-impact-tooltip'),
					},
					{
						type: 'toggle',
						field: 'decktrackerShowMulliganDeckOverview',
						label: context.i18n.translateString('settings.decktracker.mulligan.show-mulligan-deck-overview-label'),
						tooltip: context.i18n.translateString('settings.decktracker.mulligan.show-mulligan-deck-overview-tooltip'),
					},
					{
						type: 'toggle',
						field: 'hideMulliganWhenFriendsListIsOpen',
						label: context.i18n.translateString('settings.battlegrounds.session-widget.hide-when-friends-list-open'),
						tooltip: context.i18n.translateString('settings.battlegrounds.session-widget.hide-when-friends-list-open-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.decktrackerShowMulliganDeckOverview,
					},
					{
						type: 'dropdown',
						field: 'decktrackerMulliganLinger',
						label: context.i18n.translateString('settings.decktracker.mulligan.keep-after-mulligan-label'),
						tooltip: context.i18n.translateString('settings.decktracker.mulligan.keep-after-mulligan-tooltip'),
						dropdownConfig: {
							options: mulliganLingerOptions(context),
						},
					},
					{
						type: 'dropdown',
						field: 'decktrackerMulliganPersonalMinGames',
						label: context.i18n.translateString('settings.decktracker.mulligan.personal-min-games-label'),
						tooltip: context.i18n.translateString('settings.decktracker.mulligan.personal-min-games-tooltip'),
						dropdownConfig: {
							options: mulliganPersonalMinGamesOptions(context),
						},
					},
					{
						type: 'slider',
						field: 'decktrackerMulliganScale',
						label: context.i18n.translateString('settings.decktracker.mulligan.size'),
						tooltip: null,
						sliderConfig: {
							min: 25,
							max: 175,
							snapSensitivity: 5,
							knobs: sizeKnobs(context),
						},
					},
				],
			},
		],
	};
};
