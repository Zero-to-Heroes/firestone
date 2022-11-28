import { HsAchievementInfo } from '../../../../achievement/achievements-info';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class AchievementsUpdatedEvent implements MainWindowStoreEvent {
	constructor(public readonly achievements: readonly HsAchievementInfo[]) {}

	public static eventName(): string {
		return 'AchievementsUpdatedEvent';
	}

	public eventName(): string {
		return 'AchievementsUpdatedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
