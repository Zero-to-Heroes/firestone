import { MercenariesCategoryId } from '../../../../../models/mercenaries/mercenary-category-id.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesSelectCategoryEvent implements MainWindowStoreEvent {
	constructor(public readonly categoryId: MercenariesCategoryId) {}

	public static eventName(): string {
		return 'MercenariesSelectCategoryEvent';
	}

	public eventName(): string {
		return 'MercenariesSelectCategoryEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}
}
