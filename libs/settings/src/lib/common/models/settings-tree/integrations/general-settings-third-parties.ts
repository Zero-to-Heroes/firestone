import { SettingContext, SettingNode } from '../../settings.types';

export const generalThirdPartiesSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-third-parties',
		name: context.i18n.translateString('settings.general.menu.third-party'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'general-third-parties',
				keywords: ['hearthpwn', 'd0nkey', 'hsguru', 'out of cards', 'out of games', 'vicious syndicate'],
				componentType: 'SettingsGeneralThirdPartyComponent',
			},
		],
	};
};
