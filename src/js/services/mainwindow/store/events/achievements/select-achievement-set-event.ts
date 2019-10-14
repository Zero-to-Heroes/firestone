import { MainWindowStoreEvent } from '../main-window-store-event';

export class SelectAchievementSetEvent implements MainWindowStoreEvent {
	constructor(achievementSetId: string) {
		this.achievementSetId = achievementSetId;
	}
	readonly achievementSetId: string;

	public static eventName(): string {
		return 'SelectAchievementSetEvent';
	}

	public eventName(): string {
		return 'SelectAchievementSetEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}
}
