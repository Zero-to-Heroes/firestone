import { SettingContext, SettingNode } from '../../settings.types';
import { battlegroundsGlobalSettings } from './battlegrounds-settings-global';
import { battlegroundsLeaderboardSettings } from './battlegrounds-settings-leaderboard';
import { battlegroundsOverlaySettings } from './battlegrounds-settings-overlay';
import { battlegroundsSessionWidgetSettings } from './battlegrounds-settings-session-widget';

export const battlegroundsSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'battlegrounds-root',
		name: context.i18n.translateString('settings.menu.battlegrounds'),
		keywords: null,
		children: [
			battlegroundsGlobalSettings(context),
			battlegroundsOverlaySettings(context),
			battlegroundsSessionWidgetSettings(context),
			battlegroundsLeaderboardSettings(context),
		],
	};
};
