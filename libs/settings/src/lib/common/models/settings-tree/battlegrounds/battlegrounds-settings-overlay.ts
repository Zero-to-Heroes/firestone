import { Preferences } from '@firestone/shared/common/service';
import { Knob } from '@firestone/shared/common/view';
import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs, toSetting } from '../common';
import { CounterSetting } from '../decktracker/internal/decktracker-settings-internal';

export const battlegroundsOverlaySettings = (context: SettingContext): SettingNode => {
	return {
		id: 'battlegrounds-overlay',
		name: context.i18n.translateString('settings.battlegrounds.menu.overlay'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'battlegrounds-overlay',
				title: context.i18n.translateString('settings.battlegrounds.overlay.overlay-title'),
				settings: [
					{
						type: 'toggle',
						field: 'bgsShowHeroSelectionTiers',
						label: context.i18n.translateString('settings.battlegrounds.general.show-hero-tier-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-hero-tier-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
					},
					{
						type: 'toggle',
						field: 'bgsShowHeroTipsOverlay',
						label: context.i18n.translateString('settings.battlegrounds.general.show-hero-tips-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-hero-tips-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
						premiumSetting: true,
					},
					{
						type: 'toggle',
						field: 'bgsShowTrinketTipsOverlay',
						label: context.i18n.translateString('settings.battlegrounds.general.show-trinket-tips-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-trinket-tips-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
					},
					{
						type: 'toggle',
						field: 'bgsShowTrinketStatsOverlay',
						label: context.i18n.translateString('settings.battlegrounds.general.show-trinket-stats-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-trinket-stats-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
					},
					{
						type: 'toggle',
						field: 'bgsShowQuestStatsOverlay',
						label: context.i18n.translateString('settings.battlegrounds.general.show-quest-stats-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-quest-stats-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
					},
					{
						type: 'toggle',
						field: 'bgsEnableMinionAutoHighlight',
						label: context.i18n.translateString('settings.battlegrounds.general.show-minions-auto-highlight-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-minions-auto-highlight-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
						premiumSetting: true,
					},
					{
						type: 'toggle',
						field: 'bgsEnableTribeAutoHighlight',
						label: context.i18n.translateString('settings.battlegrounds.general.show-tribes-auto-highlight-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-tribes-auto-highlight-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
						premiumSetting: true,
					},
					{
						type: 'toggle',
						field: 'bgsShowBannedTribesOverlay',
						label: context.i18n.translateString('settings.battlegrounds.overlay.show-banned-tribes-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.show-banned-tribes-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
					},
					{
						type: 'toggle',
						field: 'bgsEnableMinionListOverlay',
						label: context.i18n.translateString('settings.battlegrounds.overlay.show-minions-list-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.show-minions-list-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
					},
					{
						type: 'toggle',
						field: 'bgsEnableTurnNumbertOverlay',
						label: context.i18n.translateString('settings.battlegrounds.overlay.turn-counter-label'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
					},
					{
						type: 'toggle',
						field: 'bgsShowLastOpponentIconInOverlay',
						label: context.i18n.translateString('settings.battlegrounds.overlay.last-opponent-icon-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.last-opponent-icon-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
					},
					{
						type: 'toggle',
						field: 'bgsEnableOpponentBoardMouseOver',
						label: context.i18n.translateString('settings.battlegrounds.overlay.last-opponent-board-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.last-opponent-board-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
					},
					{
						type: 'toggle',
						field: 'bgsEnableBattleSimulationOverlay',
						label: context.i18n.translateString('settings.battlegrounds.overlay.battle-simulation-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.battle-simulation-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableSimulation,
					},
					{
						type: 'toggle',
						field: 'bgsShowHeroSelectionAchievements',
						label: context.i18n.translateString('settings.battlegrounds.general.show-achievements-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-achievements-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
					},
				],
			},
			// TODO: move this
			{
				id: 'battlegrounds-simulator-overlay',
				title: context.i18n.translateString('settings.battlegrounds.general.simulator-config-title'),
				settings: [
					{
						type: 'toggle',
						field: 'bgsEnableSimulationSampleInOverlay',
						label: context.i18n.translateString('settings.battlegrounds.overlay.battle-simulation-example-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.battle-simulation-example-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableSimulation || !prefs.bgsEnableBattleSimulationOverlay,
					},
					{
						type: 'slider',
						field: 'bgsSimulatorScale',
						label: context.i18n.translateString('settings.global.widget-size-label'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableSimulation || !prefs.bgsEnableBattleSimulationOverlay,
						sliderConfig: {
							min: 80,
							max: 170,
							snapSensitivity: 3,
							knobs: sizeKnobs(context),
						},
					},
				],
			},
			// TODO: move this
			{
				id: 'battlegrounds-banned-tribes-overlay',
				title: context.i18n.translateString('settings.battlegrounds.overlay.banned-tribes-title'),
				settings: [
					{
						type: 'toggle',
						field: 'bgsBannedTribesShowVertically',
						label: context.i18n.translateString('settings.battlegrounds.overlay.banned-tribes-show-in-column-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.banned-tribes-show-in-column-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsShowBannedTribesOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsShowAvailableTribesOverlay',
						label: context.i18n.translateString('settings.battlegrounds.overlay.show-available-tribes-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.show-available-tribes-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsShowBannedTribesOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsTribesOverlaySingleRow',
						label: context.i18n.translateString('settings.battlegrounds.overlay.banned-tribes-single-row-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.banned-tribes-single-row-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsShowBannedTribesOverlay,
					},
					{
						type: 'slider',
						field: 'bgsBannedTribeScale',
						label: context.i18n.translateString('settings.battlegrounds.overlay.banned-tribes-icon-size-label'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsShowBannedTribesOverlay,
						sliderConfig: {
							min: 80,
							max: 135,
							snapSensitivity: 3,
							knobs: sizeKnobs(context),
						},
					},
				],
			},
			{
				id: 'battlegrounds-minions-list-overlay',
				title: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-title'),
				settings: [
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
						field: 'bgsShowMechanicsTiers',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-mechanics-tiers-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-mechanics-tiers-tooltip'),
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
						field: 'bgsShowTierSeven',
						label: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-tier-7-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.minions-list-show-tier-7-tooltip'),
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
				id: 'battlegrounds-opponent-board',
				title: context.i18n.translateString('settings.battlegrounds.overlay.opponent-board-title'),
				settings: [
					{
						type: 'toggle',
						field: 'bgsOpponentOverlayAtTop',
						label: context.i18n.translateString('settings.battlegrounds.overlay.opponent-board-show-top-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.opponent-board-show-top-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsEnableOpponentBoardMouseOver || !prefs.bgsFullToggle,
					},
					{
						type: 'slider',
						field: 'bgsOpponentBoardScale',
						label: context.i18n.translateString('settings.global.widget-size-label'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableMinionListOverlay,
						sliderConfig: {
							min: 80,
							max: 150,
							snapSensitivity: 3,
							knobs: sizeKnobs(context),
						},
					},
				],
			},
			{
				id: 'battlegrounds-counters',
				title: context.i18n.translateString('settings.battlegrounds.overlay.counters-title'),
				settings: counters(context).map((counter) => toSetting(counter)),
			},
			{
				id: 'battlegrounds-quests',
				title: context.i18n.translateString('settings.battlegrounds.overlay.quest-stats-title'),
				settings: [
					{
						type: 'slider',
						field: 'bgsQuestsOverlayScale',
						label: context.i18n.translateString('settings.global.widget-size-label'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableApp || !prefs.bgsShowQuestStatsOverlay,
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

const counters = (context: SettingContext): readonly CounterSetting[] => rawCounters(context).sort((a, b) => a.label.localeCompare(b.label));
const rawCounters = (context: SettingContext): CounterSetting[] => [
	{
		id: 'tuskarrRaider',
		field: 'playerBgsTuskarrRaiderCounter',
		label: context.i18n.translateString('settings.battlegrounds.overlay.counter-tuskarr-raider-label'),
		tooltip: context.i18n.translateString('settings.battlegrounds.overlay.counter-tuskarr-raider-tooltip'),
	},
	{
		id: 'bloodGem',
		field: 'playerBgsBloodGemCounter',
		label: context.i18n.translateString('settings.battlegrounds.overlay.counter-blood-gem-label'),
		tooltip: context.i18n.translateString('settings.battlegrounds.overlay.counter-blood-gem-tooltip'),
	},
	{
		id: 'goldDelta',
		field: 'playerBgsGoldDeltaCounter',
		label: context.i18n.translateString('settings.battlegrounds.overlay.counter-gold-delta-label'),
		tooltip: context.i18n.translateString('settings.battlegrounds.overlay.counter-gold-delta-tooltip'),
	},
	{
		id: 'lordOfGains',
		field: 'playerBgsLordOfGainsCounter',
		label: context.i18n.translateString('settings.battlegrounds.overlay.counter-lord-of-gains-label'),
		tooltip: context.i18n.translateString('settings.battlegrounds.overlay.counter-lord-of-gains-tooltip'),
	},
	{
		id: 'majordomo',
		field: 'playerBgsMajordomoCounter',
		label: context.i18n.translateString('settings.battlegrounds.overlay.counter-majordomo-label'),
		tooltip: context.i18n.translateString('settings.battlegrounds.overlay.counter-majordomo-tooltip'),
	},
	{
		id: 'magmaloc',
		field: 'playerBgsMagmalocCounter',
		label: context.i18n.translateString('settings.battlegrounds.overlay.counter-magmaloc-label'),
		tooltip: context.i18n.translateString('settings.battlegrounds.overlay.counter-magmaloc-tooltip'),
	},
	{
		id: 'southsea',
		field: 'playerBgsSouthseaCounter',
		label: context.i18n.translateString('settings.battlegrounds.overlay.counter-soutshsea-label'),
		tooltip: context.i18n.translateString('settings.battlegrounds.overlay.counter-soutshsea-tooltip'),
	},
];

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
