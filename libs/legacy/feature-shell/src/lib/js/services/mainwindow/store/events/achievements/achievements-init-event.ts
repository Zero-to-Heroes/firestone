import { VisualAchievementCategory } from '../../../../../models/visual-achievement-category';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class AchievementsInitEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'AchievementsInitEvent';
	}

	constructor(public readonly categories: readonly VisualAchievementCategory[]) {}

	public eventName(): string {
		return 'AchievementsInitEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
