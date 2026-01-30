import { Preferences } from '@firestone/shared/common/service';
import { SettingContext, SettingNode } from '../../settings.types';

export const battlegroundsLeaderboardSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'battlegrounds-leaderboard',
		name: context.i18n.translateString('settings.battlegrounds.menu.leaderboard'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'battlegrounds-leaderboard',
				title: context.i18n.translateString('settings.battlegrounds.leaderboard.title'),
				texts: [context.i18n.translateString('settings.battlegrounds.leaderboard.text'), context.i18n.translateString('settings.battlegrounds.leaderboard.text-2'), context.i18n.translateString('settings.battlegrounds.leaderboard.text-3')],
				settings: [
					{
						type: 'toggle',
						field: 'bgsUseLeaderboardDataInOverlay',
						label: context.i18n.translateString('settings.battlegrounds.leaderboard.enable'),
						tooltip: null,
					},
					{
						type: 'toggle',
						field: 'bgsShowMmrInLeaderboardOverlay',
						label: context.i18n.translateString('settings.battlegrounds.leaderboard.show-in-leaderboard'),
						tooltip: context.i18n.translateString('settings.battlegrounds.leaderboard.show-in-leaderboard-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsUseLeaderboardDataInOverlay,
					},
					{
						type: 'toggle',
						field: 'bgsShowMmrInOpponentRecap',
						label: context.i18n.translateString('settings.battlegrounds.leaderboard.show-in-opponent-recap'),
						tooltip: context.i18n.translateString('settings.battlegrounds.leaderboard.show-in-opponent-recap-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.bgsUseLeaderboardDataInOverlay,
					},
				],
			},
		],
	};
};
