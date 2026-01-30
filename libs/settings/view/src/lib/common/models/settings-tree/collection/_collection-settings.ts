import { SettingContext, SettingNode } from '../../settings.types';
import { collectionGeneralSettings } from './collection-settings-general';

export const collectionSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'collection-root',
		name: context.i18n.translateString('settings.menu.collection'),
		keywords: null,
		children: [collectionGeneralSettings(context)],
	};
};
