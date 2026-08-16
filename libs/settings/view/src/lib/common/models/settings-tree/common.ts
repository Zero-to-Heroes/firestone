import { Setting, SettingContext } from '@firestone/settings/services';
import { CounterSetting } from './decktracker/internal/decktracker-settings-internal';

export const sizeKnobs = (context: SettingContext) => [
	{
		percentageValue: 0,
		label: context.i18n.translateString('settings.global.knob-sizes.small'),
	},
	{
		percentageValue: 50,
		label: context.i18n.translateString('settings.global.knob-sizes.medium'),
	},
	{
		percentageValue: 100,
		label: context.i18n.translateString('settings.global.knob-sizes.large'),
	},
];

export const useGroupedCountersSetting = (context: SettingContext): Setting => ({
	type: 'toggle',
	field: 'useGroupedCounters',
	label: context.i18n.translateString('settings.general.widgets.use-grouped-counters-label'),
	tooltip: context.i18n.translateString('settings.general.widgets.use-grouped-counters-tooltip'),
});

export const toSetting = (counter: CounterSetting): Setting => {
	if (counter.showLimitedOption) {
		return {
			type: 'toggle-ynlimited',
			field: counter.field,
			label: counter.label,
			tooltip: counter.tooltip,
			keywords: counter.keywords,
		};
	} else {
		return {
			type: 'toggle',
			field: counter.field,
			label: counter.label,
			tooltip: counter.tooltip,
			keywords: counter.keywords,
		};
	}
};
