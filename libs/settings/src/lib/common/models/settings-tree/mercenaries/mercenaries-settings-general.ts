import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs } from '../common';

export const mercenariesGeneralSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'mercenaries-general',
		name: context.i18n.translateString('settings.mercenaries.menu.general'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'mercenaries-general',
				title: context.i18n.translateString('settings.mercenaries.menu.general'),
				settings: [
					{
						type: 'toggle',
						field: 'mercenariesEnabled',
						label: context.i18n.translateString('settings.mercenaries.general.enabled'),
						tooltip: context.i18n.translateString('settings.mercenaries.general.enabled-tooltip'),
					},
					{
						type: 'toggle',
						field: 'mercenariesEnablePlayerTeamWidget',
						label: context.i18n.translateString('settings.mercenaries.general.player-team-widget-label'),
						tooltip: context.i18n.translateString('settings.mercenaries.general.player-team-widget-tooltip'),
					},
					{
						type: 'toggle',
						field: 'mercenariesEnableOpponentTeamWidget',
						label: context.i18n.translateString('settings.mercenaries.general.opponent-team-widget-label'),
						tooltip: context.i18n.translateString('settings.mercenaries.general.opponent-team-widget-tooltip'),
					},
					{
						type: 'toggle',
						field: 'mercenariesEnableOutOfCombatPlayerTeamWidget',
						label: context.i18n.translateString('settings.mercenaries.general.map-team-widget-label'),
						tooltip: context.i18n.translateString('settings.mercenaries.general.map-team-widget-tooltip'),
					},
					{
						type: 'toggle',
						field: 'mercenariesEnableOutOfCombatPlayerTeamWidgetOnVillage',
						label: context.i18n.translateString('settings.mercenaries.general.village-team-widget-label'),
						tooltip: context.i18n.translateString('settings.mercenaries.general.village-team-widget-tooltip'),
					},
					{
						type: 'toggle',
						field: 'mercenariesEnableActionsQueueWidgetPvE',
						label: context.i18n.translateString('settings.mercenaries.general.action-queue-pve-label'),
						tooltip: context.i18n.translateString('settings.mercenaries.general.action-queue-pve-tooltip'),
					},
					{
						type: 'toggle',
						field: 'mercenariesEnableActionsQueueWidgetPvP',
						label: context.i18n.translateString('settings.mercenaries.general.action-queue-pvp-label'),
						tooltip: context.i18n.translateString('settings.mercenaries.general.action-queue-pvp-tooltip'),
					},
					{
						type: 'toggle',
						field: 'mercenariesHighlightSynergies',
						label: context.i18n.translateString('settings.mercenaries.general.synergies-label'),
						tooltip: context.i18n.translateString('settings.mercenaries.general.synergies-tooltip'),
					},
					{
						type: 'toggle',
						field: 'mercenariesShowTurnCounterInBattle',
						label: context.i18n.translateString('settings.mercenaries.general.turn-counter-battle-label'),
						tooltip: context.i18n.translateString('settings.mercenaries.general.turn-counter-battle-tooltip'),
					},
					{
						type: 'slider',
						field: 'mercenariesPlayerTeamOverlayScale',
						label: context.i18n.translateString('settings.mercenaries.general.your-team'),
						tooltip: null,
						sliderConfig: {
							min: 75,
							max: 125,
							snapSensitivity: 3,
							knobs: sizeKnobs(context),
						},
					},
					{
						type: 'slider',
						field: 'mercenariesOpponentTeamOverlayScale',
						label: context.i18n.translateString('settings.mercenaries.general.opponent-team'),
						tooltip: null,
						sliderConfig: {
							min: 75,
							max: 125,
							snapSensitivity: 3,
							knobs: sizeKnobs(context),
						},
					},
					{
						type: 'slider',
						field: 'mercenariesActionsQueueOverlayScale',
						label: context.i18n.translateString('settings.mercenaries.general.action-queue'),
						tooltip: null,
						sliderConfig: {
							min: 75,
							max: 125,
							snapSensitivity: 3,
							knobs: sizeKnobs(context),
						},
					},
				],
			},
		],
	};
};
