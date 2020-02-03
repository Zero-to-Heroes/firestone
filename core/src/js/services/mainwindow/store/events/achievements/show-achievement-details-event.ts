import { MainWindowStoreEvent } from '../main-window-store-event';

export class ShowAchievementDetailsEvent implements MainWindowStoreEvent {
	constructor(achievementId: string) {
		this.achievementId = achievementId;
	}
	readonly achievementId: string;

	public static eventName(): string {
		return 'ShowAchievementDetailsEvent';
	}

	public eventName(): string {
		return 'ShowAchievementDetailsEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
