import { ILocalizationService } from '@firestone/shared/framework/core';
import { map, tap } from 'rxjs';
import { SettingContext, SettingNode } from '../../settings.types';

export const generalLotterySettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-lottery',
		name: context.i18n.translateString('settings.general.menu.lottery'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'general-lottery',
				title: context.i18n.translateString('settings.general.menu.lottery'),
				texts: [
					lotteryText1(context.i18n),
					context.i18n.translateString('settings.general.premium.lottery-block-text2'),
					context.i18n.translateString('settings.general.premium.lottery-block-text3'),
					context.i18n.translateString('settings.general.premium.lottery-block-text4'),
				],
				settings: [
					{
						type: 'toggle',
						field: 'showLottery',
						label: context.i18n.translateString('settings.general.premium.lottery-button-text'),
						tooltip: null,
					},
				],
			},
			{
				id: 'general-lottery-widget-settings',
				title: context.i18n.translateString('settings.general.premium.lottery-widget-settings-title'),
				settings: [
					{
						type: 'slider',
						field: 'lotteryOpacity',
						label: context.i18n.translateString('settings.general.premium.lottery-opacity-title'),
						tooltip: null,
						sliderConfig: {
							min: 0,
							max: 100,
							showCurrentValue: true,
							snapSensitivity: 5,
						},
					},
				],
			},
			{
				id: 'general-lottery-premium',
				title: context.i18n.translateString('settings.general.menu.premium'),
				disabled$: () =>
					context.adService.hasPremiumSub$$.pipe(
						tap((sub) => console.debug('has premium sub', sub)),
						map((sub) => !sub),
					),
				settings: [
					{
						type: 'slider',
						field: 'lotteryScale',
						label: context.i18n.translateString('settings.general.premium.lottery-size-title'),
						tooltip: context.i18n.translateString('settings.general.premium.lottery-premium-section-tooltip'),
						sliderConfig: {
							min: 30,
							max: 125,
							snapSensitivity: 5,
							knobs: [
								{
									absoluteValue: 30,
									label: context.i18n.translateString('settings.global.knob-sizes.small'),
								},
								{
									absoluteValue: 100,
									label: context.i18n.translateString('settings.global.knob-sizes.medium'),
								},
								{
									absoluteValue: 125,
									label: context.i18n.translateString('settings.global.knob-sizes.large'),
								},
							],
						},
					},
				],
			},
		],
	};
};

const lotteryText1 = (i18n: ILocalizationService): string => {
	return i18n.translateString('settings.general.premium.lottery-block-text1', {
		twitterLink: `<a href="https://twitter.com/ZerotoHeroes_HS" target="_blank">${i18n.translateString('global.social.twitter')}</a>`,
		discordLink: `<a href="https://discord.gg/vKeB3gnKTy" target="_blank">${i18n.translateString('global.social.discord')}</a>`,
	});
};
