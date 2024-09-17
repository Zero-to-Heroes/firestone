import { SettingContext, SettingNode } from '../../settings.types';

export const generalBugSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-bug',
		name: context.i18n.translateString('settings.general.bug-report.menu-title'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'general-bug',
				componentType: 'SettingsGeneralBugReportComponent',
			},
		],
	};
};
