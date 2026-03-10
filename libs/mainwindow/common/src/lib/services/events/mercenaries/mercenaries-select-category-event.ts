import { MainWindowStoreEvent } from '../main-window-store-event';
import { MercenariesCategoryId } from '@firestone/shared/common/service';

export class MercenariesSelectCategoryEvent implements MainWindowStoreEvent {
	
	readonly eventName = MercenariesSelectCategoryEvent.eventName

	constructor(public readonly categoryId: MercenariesCategoryId) {}

	static readonly eventName = 'MercenariesSelectCategoryEvent'
}
