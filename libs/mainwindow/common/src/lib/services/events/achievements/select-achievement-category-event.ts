import { MainWindowStoreEvent } from '../main-window-store-event';

export class SelectAchievementCategoryEvent implements MainWindowStoreEvent {
	
	readonly eventName = SelectAchievementCategoryEvent.eventName

	constructor(categoryId: string) {
		this.categoryId = categoryId;
	}
	readonly categoryId: string;

	static readonly eventName = 'SelectAchievementCategoryEvent'
}
