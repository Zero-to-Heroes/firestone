import { SettingContext, SettingNode } from '../../settings.types';
import { achievementsGeneralSettings } from './achievements-settings-general';

export const achievementsSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'achievements-root',
		name: context.i18n.translateString('settings.menu.achievements'),
		keywords: null,
		children: [achievementsGeneralSettings(context)],
	};
};
