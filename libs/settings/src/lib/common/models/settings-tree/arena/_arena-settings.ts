import { SettingContext, SettingNode } from '../../settings.types';
import { arenaGeneralSettings } from './arena-settings-general';

export const arenaSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'arena-root',
		name: context.i18n.translateString('settings.menu.arena'),
		keywords: null,
		children: [arenaGeneralSettings(context)],
	};
};
