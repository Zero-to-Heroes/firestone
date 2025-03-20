/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { getAllCounters } from '@firestone/game-state';
import { Preferences } from '@firestone/shared/common/service';
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
						type: 'slider',
						field: 'bgsHeroSelectionOverlayScale',
						label: context.i18n.translateString('settings.battlegrounds.general.hero-stats-overlay-scale'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsShowHeroSelectionTiers,
						sliderConfig: {
							min: 50,
							max: 150,
							snapSensitivity: 3,
							knobs: sizeKnobs(context),
						},
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
						field: 'bgsShowHeroSelectionAchievements',
						label: context.i18n.translateString('settings.battlegrounds.general.show-achievements-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-achievements-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
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
	...getAllCounters(context.i18n, context.allCards)
		.filter((counter) => counter.type === 'battlegrounds')
		.filter((counter) => counter.player?.pref)
		.map((counter) => ({
			id: counter.id,
			field: counter.player!.pref,
			label: counter.player!.setting.label(context.i18n),
			tooltip: counter.player!.setting.tooltip(context.i18n, context.allCards),
		})),
];
