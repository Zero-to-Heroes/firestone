/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SettingContext, SettingNode } from '../../settings.types';
import { battlegroundsBannedTribesSettings } from './battlegrounds-settings-banned-tribes';
import { battlegroundsBattleOddsSettings } from './battlegrounds-settings-battle-odds';
import { battlegroundsGlobalSettings } from './battlegrounds-settings-global';
import { battlegroundsLeaderboardSettings } from './battlegrounds-settings-leaderboard';
import { battlegroundsMinionsListSettings } from './battlegrounds-settings-minions-list';
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
			battlegroundsBattleOddsSettings(context),
			battlegroundsMinionsListSettings(context),
			battlegroundsBannedTribesSettings(context),
			battlegroundsSessionWidgetSettings(context),
			battlegroundsLeaderboardSettings(context),
		]
			.filter((s) => s != null)
			.map((s) => s!),
	};
};
