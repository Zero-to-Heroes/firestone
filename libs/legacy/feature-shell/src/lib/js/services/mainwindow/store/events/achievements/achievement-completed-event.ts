import { Achievement } from '@firestone/achievements/common';
import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class AchievementCompletedEvent implements MainWindowStoreEvent {
	constructor(public readonly achievement: Achievement) {}

	public static eventName(): string {
		return 'AchievementCompletedEvent';
	}

	public eventName(): string {
		return 'AchievementCompletedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
