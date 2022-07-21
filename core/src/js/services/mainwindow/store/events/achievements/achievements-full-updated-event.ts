import { MainWindowStoreEvent } from '../main-window-store-event';

export class AchievementsFullUpdatedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'AchievementsFullUpdatedEvent';
	}

	constructor() {}

	public eventName(): string {
		return 'AchievementsFullUpdatedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
