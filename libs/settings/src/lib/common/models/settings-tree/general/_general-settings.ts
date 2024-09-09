import { SettingContext, SettingNode } from '../../settings.types';
import { generalAccessibilitySettings } from './general-settings-accessibility';
import { generalAdminSettings } from './general-settings-admin';
import { generalDataSettings } from './general-settings-data';
import { generalLaunchSettings } from './general-settings-launch';
import { generalNotificationsSettings } from './general-settings-notifications';

export const generalSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-root',
		name: context.i18n.translateString('settings.menu.general'),
		keywords: null,
		children: [
			generalAdminSettings(context),
			generalLaunchSettings(context),
			generalNotificationsSettings(context),
			generalDataSettings(context),
			generalAccessibilitySettings(context),
		],
	};
};
