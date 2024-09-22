import { SettingContext, SettingNode } from '../../settings.types';
import { generalLotterySettings } from './general-settings-lottery';
import { generalQuestsSettings } from './general-settings-quests';
import { globalWidgetSettings } from './global-settings-widgets';

export const globalSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'global-root',
		name: context.i18n.translateString('settings.menu.global'),
		keywords: null,
		children: [generalQuestsSettings(context), generalLotterySettings(context), globalWidgetSettings(context)],
	};
};
