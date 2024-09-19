import { SettingContext } from '../settings.types';

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
