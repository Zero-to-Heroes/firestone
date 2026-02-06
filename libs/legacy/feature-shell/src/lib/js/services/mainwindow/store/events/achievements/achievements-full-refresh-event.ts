import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class AchievementsFullRefreshEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'AchievementsFullRefreshEvent';
	}

	public eventName(): string {
		return 'AchievementsFullRefreshEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
