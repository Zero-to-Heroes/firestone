import { DuelsCategoryType } from '../../../../../models/mainwindow/duels/duels-category.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsSelectCategoryEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsSelectCategoryEvent';
	}

	constructor(public readonly categoryId: DuelsCategoryType) {}

	public eventName(): string {
		return 'DuelsSelectCategoryEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
