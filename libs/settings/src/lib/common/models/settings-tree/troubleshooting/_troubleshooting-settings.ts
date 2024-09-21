import { SettingContext, SettingNode } from '../../settings.types';
import { generalBugSettings } from '../general/general-settings-bug';

export const troubleshootingSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'troubleshooting-root',
		name: context.i18n.translateString('settings.menu.troubleshooting'),
		keywords: null,
		children: [generalBugSettings(context)],
	};
};
