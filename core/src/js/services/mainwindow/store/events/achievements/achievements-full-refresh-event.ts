import { MainWindowStoreEvent } from '../main-window-store-event';

export class AchievementsFullRefreshEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'AchievementsFullRefreshEvent';
	}

	constructor() {}

	public eventName(): string {
		return 'AchievementsFullRefreshEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
