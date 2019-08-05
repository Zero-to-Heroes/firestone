import { MainWindowStoreEvent } from '../main-window-store-event';
import { AchievementHistory } from '../../../../../models/achievement/achievement-history';

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
}
