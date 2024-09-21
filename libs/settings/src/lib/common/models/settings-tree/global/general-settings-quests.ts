import { SettingContext, SettingNode } from '../../settings.types';

export const generalQuestsSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'general-quests',
		name: context.i18n.translateString('settings.general.menu.quests'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'general-quests',
				title: context.i18n.translateString('settings.general.menu.quests'),
				settings: [
					{
						type: 'toggle',
						field: 'enableQuestsWidget',
						label: context.i18n.translateString('settings.general.quests.enable-quests-label'),
						tooltip: context.i18n.translateString('settings.general.quests.enable-quests-tooltip'),
					},
					{
						type: 'toggle',
						field: 'showQuestsWidgetWhenEmpty',
						label: context.i18n.translateString('settings.general.quests.show-when-empty-label'),
						tooltip: context.i18n.translateString('settings.general.quests.show-when-empty-tooltip'),
						disabledIf: (prefs) => !prefs.enableQuestsWidget,
					},
					{
						type: 'toggle',
						field: 'showQuestsInGame',
						label: context.i18n.translateString('settings.general.quests.show-in-game-label'),
						tooltip: context.i18n.translateString('settings.general.quests.show-in-game-tooltip'),
						disabledIf: (prefs) => !prefs.enableQuestsWidget,
					},
					{
						type: 'toggle',
						field: 'hsShowQuestsWidget',
						label: context.i18n.translateString('settings.general.quests.constructed-label'),
						tooltip: context.i18n.translateString('settings.general.quests.constructed-tooltip'),
						disabledIf: (prefs) => !prefs.enableQuestsWidget,
					},
					{
						type: 'toggle',
						field: 'hsShowQuestsWidgetOnHub',
						label: context.i18n.translateString('settings.general.quests.constructed-on-hub-label'),
						tooltip: context.i18n.translateString('settings.general.quests.constructed-on-hub-tooltip'),
						disabledIf: (prefs) => !prefs.enableQuestsWidget || !prefs.hsShowQuestsWidget,
					},
					{
						type: 'toggle',
						field: 'hsShowQuestsWidgetOnBg',
						label: context.i18n.translateString('settings.general.quests.constructed-on-bg-label'),
						tooltip: context.i18n.translateString('settings.general.quests.constructed-on-bg-tooltip'),
						disabledIf: (prefs) => !prefs.enableQuestsWidget || !prefs.hsShowQuestsWidget,
					},
					{
						type: 'toggle',
						field: 'bgsShowQuestsWidget',
						label: context.i18n.translateString('settings.general.quests.battlegrounds-label'),
						tooltip: context.i18n.translateString('settings.general.quests.battlegrounds-tooltip'),
						disabledIf: (prefs) => !prefs.enableQuestsWidget,
					},
					{
						type: 'toggle',
						field: 'mercsShowQuestsWidget',
						label: context.i18n.translateString('settings.general.quests.mercenaries-label'),
						tooltip: context.i18n.translateString('settings.general.quests.mercenaries-tooltip'),
						disabledIf: (prefs) => !prefs.enableQuestsWidget,
					},
				],
			},
		],
	};
};
