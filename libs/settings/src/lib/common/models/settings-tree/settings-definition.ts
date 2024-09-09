import { SettingContext, SettingNode } from '../settings.types';
import { generalSettings } from './general/_general-settings';

export const settingsDefinition = (context: SettingContext): SettingNode => {
	return {
		id: 'root',
		name: context.i18n.translateString('settings.title'),
		keywords: null,
		children: [generalSettings(context)],
	};
};
