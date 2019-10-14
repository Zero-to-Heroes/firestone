import { AchievementHistory } from '../../../../../models/achievement/achievement-history';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class AchievementHistoryCreatedEvent implements MainWindowStoreEvent {
	constructor(history: AchievementHistory) {
		this.history = history;
	}
	readonly history: AchievementHistory;

	public static eventName(): string {
		return 'AchievementHistoryCreatedEvent';
	}

	public eventName(): string {
		return 'AchievementHistoryCreatedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
