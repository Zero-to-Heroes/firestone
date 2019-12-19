import { AchievementsState } from '../../../../../models/mainwindow/achievements-state';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class AchievementsInitEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'AchievementsInitEvent';
	}

	constructor(public readonly newState: AchievementsState) {}

	public eventName(): string {
		return 'AchievementsInitEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
