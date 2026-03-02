import { SettingContext, SettingNode } from '@firestone/settings/services';
import { replayGeneralSettings } from './replay-settings-general';
import { replayInGameSettings } from './replay-settings-in-game';

export const replaySettings = (context: SettingContext): SettingNode => {
	return {
		id: 'replay-root',
		name: context.i18n.translateString('settings.menu.replay'),
		keywords: null,
		children: [replayGeneralSettings(context), replayInGameSettings(context)],
	};
};
