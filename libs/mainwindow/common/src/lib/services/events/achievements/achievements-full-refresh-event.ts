import { MainWindowStoreEvent } from '../main-window-store-event';

export class AchievementsFullRefreshEvent implements MainWindowStoreEvent {
	
	readonly eventName = AchievementsFullRefreshEvent.eventName

	static readonly eventName = 'AchievementsFullRefreshEvent'
}
