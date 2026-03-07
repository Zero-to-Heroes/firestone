import { MainWindowStoreEvent } from '../main-window-store-event';

export class SelectAchievementCategoryEvent implements MainWindowStoreEvent {
	constructor(categoryId: string) {
		this.categoryId = categoryId;
	}
	readonly categoryId: string;

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
