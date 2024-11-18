import { Preferences } from '@firestone/shared/common/service';
import { Knob } from '@firestone/shared/common/view';
import { SettingContext, SettingNode } from '../../settings.types';

export const battlegroundsMinionsListSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'battlegrounds-minions-list',
		name: context.i18n.translateString('settings.battlegrounds.menu.minions-list'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'battlegrounds-minions-list-overlay',
				title: context.i18n.translateString('settings.battlegrounds.overlay.overlay-title'),
				settings: [
					{
						type: 'toggle',
						field: 'bgsEnableMinionListOverlay',
						label: context.i18n.translateString('settings.battlegrounds.overlay.show-minions-list-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.show-minions-list-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
					},
					{
						type: 'toggle',
						field: 'bgsUseNewTiersHeaderStyle',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-new-header-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-new-header-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsShowTribeTiers',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-tribe-tiers-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-tribe-tiers-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsShowMechanicsTiers',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-mechanics-tiers-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-mechanics-tiers-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsMinionsListShowCompositions',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-compositions-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-compositions-tooltip', {
							newHeaderOption: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-new-header-label'),
						}),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay || !prefs.bgsUseNewTiersHeaderStyle,
					},
					{
						type: 'toggle',
						field: 'bgsEnableMinionListMouseOver',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-on-mouse-over-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-on-mouse-over-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay,
						advancedSetting: true,
						toggleConfig: {
							messageWhenToggleValue: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-on-mouse-over-confirmation'),
							valueToDisplayMessageOn: false,
						},
					},
					{
						type: 'toggle',
						field: 'bgsGroupMinionsIntoTheirTribeGroup',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-group-minions-into-tribes-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-group-minions-into-tribes-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsShowTribesHighlight',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-tribes-highlight-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-tribes-highlight-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsShowTierSeven',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-tier-7-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-tier-7-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsShowBuddies',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-buddies-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-buddies-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsShowTrinkets',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-trinkets-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-trinkets-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsIncludeTrinketsInTribeGroups',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-include-trinkets-in-tribes-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-include-trinkets-in-tribes-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsMinionListShowGoldenCard',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-golden-cards-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-golden-cards-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsMinionListShowSpellsAtBottom',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-spells-at-bottom-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-spells-at-bottom-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay,
					},
					{
						type: 'slider',
						field: 'bgsMinionsListScale',
						label: context.i18n.translateString('settings.global.widget-size-label'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay,
						sliderConfig: {
							min: 40,
							max: 135,
							snapSensitivity: 3,
							knobs: minionsListSizeKnobs(context),
						},
					},
				],
			},
			{
				id: 'battlegrounds-minions-list-overlay-compositions',
				title: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-compositions.header'),
				settings: [
					{
						type: 'toggle',
						field: 'bgsMinionsListCompositionsFadeHigherTierCards',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-compositions.fade-higher-tier-cards-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-compositions.fade-higher-tier-cards-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsMinionsListShowCompositions,
					},
				],
			},
		],
	};
};

const minionsListSizeKnobs = (context: SettingContext): readonly Knob[] => [
	{
		absoluteValue: 40,
		label: context.i18n.translateString('settings.global.knob-sizes.small'),
	},
	{
		absoluteValue: 100,
		label: context.i18n.translateString('settings.global.knob-sizes.medium'),
	},
	{
		absoluteValue: 135,
		label: context.i18n.translateString('settings.global.knob-sizes.large'),
	},
];
