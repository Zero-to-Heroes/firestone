import { Preferences } from '@firestone/shared/common/service';
import { SettingContext, SettingNode } from '../../settings.types';

export const collectionGeneralSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'collection-general',
		name: context.i18n.translateString('settings.collection.menu.general'),
		keywords: null,
		children: null,
		sections: [
			{
				id: 'collection-general',
				title: context.i18n.translateString('settings.collection.general.title'),
				settings: [
					{
						type: 'toggle',
						field: 'collectionUseHighResImages',
						label: context.i18n.translateString('settings.collection.general.high-resolution-images-label'),
						tooltip: null,
					},
					{
						type: 'toggle',
						field: 'collectionShowRelatedCards',
						label: context.i18n.translateString('settings.collection.general.show-related-cards-label'),
						tooltip: context.i18n.translateString('settings.collection.general.show-related-cards-tooltip'),
					},
					{
						type: 'slider',
						field: 'collectionCardScale',
						label: context.i18n.translateString('settings.collection.general.card-size-in-collection-label'),
						tooltip: null,
						sliderConfig: {
							min: 75,
							max: 150,
							snapSensitivity: 3,
						},
					},
				],
			},
			{
				id: 'collection-notifications',
				title: context.i18n.translateString('settings.general.notifications.title'),
				texts: [context.i18n.translateString('settings.collection.general.selective-notifications-label')],
				settings: [
					{
						type: 'toggle',
						field: 'collectionEnableNotifications',
						label: context.i18n.translateString('settings.collection.general.notifications-label'),
						tooltip: null,
					},
					{
						type: 'toggle',
						field: 'showDust',
						label: context.i18n.translateString('settings.collection.general.notifications-dust-recap-label'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.collectionEnableNotifications,
					},
					{
						type: 'toggle',
						field: 'showCommon',
						label: context.i18n.translateString('settings.collection.general.notifications-non-golden-commons-label'),
						tooltip: null,
						disabledIf: (prefs: Preferences) => !prefs.collectionEnableNotifications,
					},
					{
						type: 'toggle',
						field: 'showCardsOutsideOfPacks',
						label: context.i18n.translateString('settings.collection.general.notifications-rewards-label'),
						tooltip: context.i18n.translateString('settings.collection.general.notifications-rewards-tooltip'),
						disabledIf: (prefs: Preferences) => !prefs.collectionEnableNotifications,
					},
				],
			},
		],
	};
};
