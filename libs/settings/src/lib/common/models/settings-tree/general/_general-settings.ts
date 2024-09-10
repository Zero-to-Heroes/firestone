import { SettingContext, SettingNode } from '../../settings.types';
import { generalAccessibilitySettings } from './general-settings-accessibility';
import { generalAdminSettings } from './general-settings-admin';
import { generalAppearanceSettings } from './general-settings-appearance';
import { generalDataSettings } from './general-settings-data';
import { generalLaunchSettings } from './general-settings-launch';
import { generalLotterySettings } from './general-settings-lottery';
import { generalNotificationsSettings } from './general-settings-notifications';

export const generalSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-root',
		name: context.i18n.translateString('settings.menu.app'),
		keywords: null,
		children: [
			generalAdminSettings(context),
			generalLaunchSettings(context),
			generalNotificationsSettings(context),
			generalDataSettings(context),
			generalAccessibilitySettings(context),
			generalLotterySettings(context),
			generalAppearanceSettings(context),
		],
	};
};
