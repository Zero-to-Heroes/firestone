import { MainWindowStoreEvent } from '../main-window-store-event';

export class ChangeVisibleAchievementEvent implements MainWindowStoreEvent {
	constructor(achievementId: string) {
		this.achievementId = achievementId;
	}
	readonly achievementId: string;

	public static eventName(): string {
		return 'ChangeVisibleAchievementEvent';
	}

	public eventName(): string {
		return 'ChangeVisibleAchievementEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
