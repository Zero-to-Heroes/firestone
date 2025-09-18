/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BnetRegion } from '@firestone-hs/reference-data';
import { SettingContext, SettingNode } from '../../settings.types';
import { battlegroundsReconnectorSettings } from '../battlegrounds/battlegrounds-settings-reconnector';
import { generalAppearanceSettings } from '../general/general-settings-appearance';
import { generalLotterySettings } from './general-settings-lottery';
import { generalQuestsSettings } from './general-settings-quests';
import { globalWidgetSettings } from './global-settings-widgets';

export const globalSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'global-root',
		name: context.i18n.translateString('settings.menu.global'),
		keywords: null,
		children: [
			generalQuestsSettings(context),
			generalLotterySettings(context),
			globalWidgetSettings(context),
			generalAppearanceSettings(context),
			context.services.account.region$$.value === BnetRegion.REGION_CN
				? battlegroundsReconnectorSettings(context)
				: null,
		]
			.filter((s) => s != null)
			.map((s) => s!),
	};
};
