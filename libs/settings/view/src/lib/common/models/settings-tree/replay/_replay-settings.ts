import { SettingContext, SettingNode } from '../../settings.types';
import { replayGeneralSettings } from './replay-settings-general';

export const replaySettings = (context: SettingContext): SettingNode => {
	return {
		id: 'replay-root',
		name: context.i18n.translateString('settings.menu.replay'),
		keywords: null,
		children: [replayGeneralSettings(context)],
	};
};
