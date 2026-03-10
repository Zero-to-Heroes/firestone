import { MainWindowStoreEvent } from '../main-window-store-event';

export class ChangeVisibleAchievementEvent implements MainWindowStoreEvent {
	
	readonly eventName = ChangeVisibleAchievementEvent.eventName

	constructor(achievementId: string) {
		this.achievementId = achievementId;
	}
	readonly achievementId: string;

	static readonly eventName = 'ChangeVisibleAchievementEvent'
}
