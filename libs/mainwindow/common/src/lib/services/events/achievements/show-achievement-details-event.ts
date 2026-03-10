import { MainWindowStoreEvent } from '../main-window-store-event';

export class ShowAchievementDetailsEvent implements MainWindowStoreEvent {
	
	readonly eventName = ShowAchievementDetailsEvent.eventName

	constructor(achievementId: string) {
		this.achievementId = achievementId;
	}
	readonly achievementId: string;

	static readonly eventName = 'ShowAchievementDetailsEvent'
}
