import { SettingContext, SettingNode } from '@firestone/settings/services';
import { generalBugSettings } from './general-settings-bug';

export const troubleshootingSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'troubleshooting-root',
		name: context.i18n.translateString('settings.menu.troubleshooting'),
		keywords: null,
		children: [generalBugSettings(context)],
	};
};
