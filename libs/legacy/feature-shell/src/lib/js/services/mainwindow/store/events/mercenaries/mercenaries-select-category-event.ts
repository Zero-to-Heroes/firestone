import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { MercenariesCategoryId } from '@firestone/shared/common/service';

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
