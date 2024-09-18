import { SettingContext, SettingNode } from '../../settings.types';
import { decktrackerGlobalSettings } from './decktracker-settings-global';

export const decktrackerSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'decktracker-root',
		name: context.i18n.translateString('settings.menu.decktracker'),
		keywords: null,
		children: [decktrackerGlobalSettings(context)],
	};
};
