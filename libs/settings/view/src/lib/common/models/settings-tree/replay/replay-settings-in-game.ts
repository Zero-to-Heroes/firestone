import { SettingContext, SettingNode } from '@firestone/settings/services';

export const replayInGameSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'replay-in-game',
		name: context.i18n.translateString('settings.replay.menu.in-game'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'replay-in-game',
				title: context.i18n.translateString('settings.replay.menu.in-game'),
				texts: [context.i18n.translateString('settings.replay.in-game.description'), context.i18n.translateString('settings.replay.in-game.how-to-activate'), context.i18n.translateString('settings.replay.in-game.limitations')],
			},
			{
				id: 'replay-in-game-sharing',
				title: context.i18n.translateString('settings.replay.menu.in-game-sharing'),
				texts: [context.i18n.translateString('settings.replay.in-game-sharing.description')],
			},
		],
	};
};
