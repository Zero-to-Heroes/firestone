import { BnetRegion } from '@firestone-hs/reference-data';
import { ENABLE_RECONNECTOR } from '@firestone/shared/common/service';
import { SettingContext, SettingNode } from '../../settings.types';
import { battlegroundsBannedTribesSettings } from './battlegrounds-settings-banned-tribes';
import { battlegroundsBattleOddsSettings } from './battlegrounds-settings-battle-odds';
import { battlegroundsGlobalSettings } from './battlegrounds-settings-global';
import { battlegroundsLeaderboardSettings } from './battlegrounds-settings-leaderboard';
import { battlegroundsMinionsListSettings } from './battlegrounds-settings-minions-list';
import { battlegroundsOverlaySettings } from './battlegrounds-settings-overlay';
import { battlegroundsReconnectorSettings } from './battlegrounds-settings-reconnector';
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
			context.services.account.region$$.value === BnetRegion.REGION_CN && ENABLE_RECONNECTOR
				? battlegroundsReconnectorSettings(context)
				: null,
		].filter((s) => s != null),
	};
};
