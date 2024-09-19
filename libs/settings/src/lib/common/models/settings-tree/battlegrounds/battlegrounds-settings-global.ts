import { Preferences } from '@firestone/shared/common/service';
import { Knob } from '@firestone/shared/common/view';
import { SettingContext, SettingNode } from '../../settings.types';

export const battlegroundsGlobalSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'battlegrounds-global',
		name: context.i18n.translateString('settings.battlegrounds.menu.general'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'battlegrounds-global',
				title: context.i18n.translateString('settings.battlegrounds.menu.general'),
				settings: [
					{
						type: 'toggle',
						field: 'bgsFullToggle',
						label: context.i18n.translateString('settings.battlegrounds.full-toggle-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.full-toggle-tooltip'),
					},
				],
			},
			{
				id: 'battlegrounds-global-app',
				title: context.i18n.translateString('settings.battlegrounds.general.companion-app-title'),
				settings: [
					{
						type: 'toggle',
						field: 'bgsEnableApp',
						label: context.i18n.translateString('settings.battlegrounds.general.enable-app-label'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
					},
					{
						type: 'toggle',
						field: 'bgsUseOverlay',
						label: context.i18n.translateString('settings.battlegrounds.general.integrated-mode-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.integrated-mode-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableApp,
						toggleConfig: {
							toggleFunction: (newValue: boolean) => context.ow.getMainWindow().reloadBgWindows(),
						},
					},
					{
						type: 'toggle',
						field: 'bgsShowOverlayButton',
						label: context.i18n.translateString('settings.battlegrounds.general.show-overlay-button'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-overlay-button-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableApp || !prefs.bgsUseOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsShowHeroSelectionScreen',
						label: context.i18n.translateString('settings.battlegrounds.general.popup-hero-selection-screen-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.popup-hero-selection-screen-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableApp,
					},
					{
						type: 'toggle',
						field: 'bgsShowNextOpponentRecapSeparately',
						label: context.i18n.translateString('settings.battlegrounds.general.show-next-opponent-recap-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-next-opponent-recap-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableApp,
					},
					{
						type: 'toggle',
						field: 'bgsShowEndGameNotif',
						label: context.i18n.translateString('settings.battlegrounds.general.show-game-end-notif-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-game-end-notif-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableApp,
					},
					{
						type: 'toggle',
						field: 'bgsForceShowPostMatchStats2',
						label: context.i18n.translateString('settings.battlegrounds.general.popup-post-match-stats-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.popup-post-match-stats-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableApp,
					},
				],
			},
			{
				id: 'battlegrounds-global-simulator',
				title: context.i18n.translateString('settings.battlegrounds.general.simulator-config-title'),
				settings: [
					{
						type: 'toggle',
						field: 'bgsEnableSimulation',
						label: context.i18n.translateString('settings.battlegrounds.general.enable-battle-sim-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.enable-battle-sim-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle,
					},
					{
						type: 'toggle',
						field: 'bgsUseRemoteSimulator',
						label: context.i18n.translateString('settings.battlegrounds.general.use-remote-simulator-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.use-remote-simulator-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableSimulation,
						premiumSetting: true,
					},
					{
						type: 'toggle',
						field: 'bgsSimShowIntermediaryResults',
						label: context.i18n.translateString('settings.battlegrounds.general.show-intermediate-results-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-intermediate-results-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableSimulation,
					},
					{
						type: 'toggle',
						field: 'bgsHideSimResultsOnRecruit',
						label: context.i18n.translateString('settings.battlegrounds.general.hide-simulation-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.hide-simulation-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableSimulation || !prefs.bgsShowSimResultsOnlyOnRecruit,
					},
					{
						type: 'toggle',
						field: 'bgsShowSimResultsOnlyOnRecruit',
						label: context.i18n.translateString('settings.battlegrounds.general.show-sim-only-in-tavern-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-sim-only-in-tavern-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableSimulation || !prefs.bgsHideSimResultsOnRecruit,
					},
					{
						type: 'slider',
						field: 'bgsSimulatorNumberOfSims',
						label: context.i18n.translateString('settings.battlegrounds.general.simulator-number-of-sims-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.simulator-number-of-sims-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableSimulation || prefs.bgsUseRemoteSimulator,
						sliderConfig: {
							min: 700,
							max: 15_000,
							snapSensitivity: 3,
							showCurrentValue: true,
							knobs: numberOfSimsKnobs(context),
						},
					},
					{
						type: 'slider',
						field: 'bgsSimulatorMaxDurationInMillis',
						label: context.i18n.translateString('settings.battlegrounds.general.max-sim-duration-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.max-sim-duration-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableSimulation || prefs.bgsUseRemoteSimulator,
						sliderConfig: {
							min: 2_000,
							max: 20_000,
							snapSensitivity: 3,
							showCurrentValue: true,
							knobs: simDurationKnobs(context),
						},
					},
				],
			},
		],
	};
};

const numberOfSimsKnobs = (context: SettingContext): readonly Knob[] => [
	{
		absoluteValue: 8000,
	},
];
const simDurationKnobs = (context: SettingContext): readonly Knob[] => [
	{
		absoluteValue: 8000,
	},
];
