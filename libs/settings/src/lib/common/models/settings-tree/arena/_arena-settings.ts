import { SettingContext, SettingNode } from '../../settings.types';
import { arenaGeneralSettings } from './arena-settings-general';
import { arenaSessionWidgetSettings } from './arena-settings-session-widget';

export const arenaSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'arena-root',
		name: context.i18n.translateString('settings.menu.arena'),
		keywords: null,
		children: [arenaGeneralSettings(context), arenaSessionWidgetSettings(context)],
	};
};
