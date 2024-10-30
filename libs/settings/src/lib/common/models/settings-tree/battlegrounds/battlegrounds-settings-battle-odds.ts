import { Preferences } from '@firestone/shared/common/service';
import { Knob } from '@firestone/shared/common/view';
import { SettingContext, SettingNode } from '../../settings.types';
import { sizeKnobs } from '../common';

export const battlegroundsBattleOddsSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'battlegrounds-battle-odds',
		name: context.i18n.translateString('settings.battlegrounds.menu.battle-odds'),
		keywords: null,
		children: null,
		sections: [
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
							displayedValueUnit: '',
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
							displayedValueUnit: '',
						},
					},
				],
			},
			{
				id: 'battlegrounds-simulator-overlay',
				title: context.i18n.translateString('settings.battlegrounds.overlay.overlay-title'),
				settings: [
					{
						type: 'toggle',
						field: 'bgsEnableBattleSimulationOverlay',
						label: context.i18n.translateString('settings.battlegrounds.overlay.battle-simulation-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.overlay.battle-simulation-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableSimulation,
					},
					{
						type: 'toggle',
						field: 'bgsHideSimResultsOnRecruit',
						label: context.i18n.translateString('settings.battlegrounds.general.hide-simulation-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.hide-simulation-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableSimulation || !prefs.bgsEnableBattleSimulationOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsShowSimResultsOnlyOnRecruit',
						label: context.i18n.translateString('settings.battlegrounds.general.show-sim-only-in-tavern-label'),
						tooltip: context.i18n.translateString('settings.battlegrounds.general.show-sim-only-in-tavern-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsFullToggle || !prefs.bgsEnableSimulation || !prefs.bgsHideSimResultsOnRecruit,
					},
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
