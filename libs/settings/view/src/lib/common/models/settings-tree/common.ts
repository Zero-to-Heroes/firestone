import { DropdownOption, Setting, SettingContext } from '@firestone/settings/services';
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

export const mulliganLingerOptions = (context: SettingContext): readonly DropdownOption[] => [
	{
		value: 'off',
		label: context.i18n.translateString('settings.decktracker.mulligan.keep-after-mulligan-off'),
	} as DropdownOption,
	{
		value: '5',
		label: context.i18n.translateString('settings.decktracker.mulligan.keep-after-mulligan-5'),
	} as DropdownOption,
	{
		value: '10',
		label: context.i18n.translateString('settings.decktracker.mulligan.keep-after-mulligan-10'),
	} as DropdownOption,
	{
		value: 'until-dismissed',
		label: context.i18n.translateString('settings.decktracker.mulligan.keep-after-mulligan-until-dismissed'),
	} as DropdownOption,
];

export const mulliganPersonalMinGamesOptions = (context: SettingContext): readonly DropdownOption[] => [
	{
		value: 'never',
		label: context.i18n.translateString('settings.decktracker.mulligan.personal-min-games-never'),
	} as DropdownOption,
	{
		value: 'always',
		label: context.i18n.translateString('settings.decktracker.mulligan.personal-min-games-always'),
	} as DropdownOption,
	{
		value: '10',
		label: context.i18n.translateString('settings.decktracker.mulligan.personal-min-games-count', { value: 10 }),
	} as DropdownOption,
	{
		value: '25',
		label: context.i18n.translateString('settings.decktracker.mulligan.personal-min-games-count', { value: 25 }),
	} as DropdownOption,
	{
		value: '50',
		label: context.i18n.translateString('settings.decktracker.mulligan.personal-min-games-count', { value: 50 }),
	} as DropdownOption,
	{
		value: '100',
		label: context.i18n.translateString('settings.decktracker.mulligan.personal-min-games-count', { value: 100 }),
	} as DropdownOption,
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
