import { BgsHeroSortFilterType } from '@firestone/battlegrounds/services';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsHeroSortFilterSelectedEvent implements MainWindowStoreEvent {
	
	readonly eventName = BgsHeroSortFilterSelectedEvent.eventName

	constructor(public readonly heroSortFilter: BgsHeroSortFilterType) {}

	static readonly eventName = 'BgsHeroSortFilterSelectedEvent'
}
