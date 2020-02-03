import { MainWindowStoreEvent } from '../main-window-store-event';

export class SelectAchievementCategoryEvent implements MainWindowStoreEvent {
	constructor(globalCategoryId: string) {
		this.globalCategoryId = globalCategoryId;
	}
	readonly globalCategoryId: string;

	public static eventName(): string {
		return 'SelectAchievementCategoryEvent';
	}

	public eventName(): string {
		return 'SelectAchievementCategoryEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
