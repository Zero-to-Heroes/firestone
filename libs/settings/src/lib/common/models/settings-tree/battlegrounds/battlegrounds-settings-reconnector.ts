import { SettingContext, SettingNode } from '../../settings.types';

export const battlegroundsReconnectorSettings = (context: SettingContext): SettingNode => {
	return {
		id: 'battlegrounds-reconnector',
		name: '重接器',
		keywords: null,
		children: null,
		sections: [
			{
				id: 'battlegrounds-reconnector',
				title: '重接器',
				settings: [
					{
						type: 'toggle',
						field: 'bgsReconnectorEnabled',
						label: '启用重新连接',
						tooltip: null,
					},
				],
			},
		],
	};
};
