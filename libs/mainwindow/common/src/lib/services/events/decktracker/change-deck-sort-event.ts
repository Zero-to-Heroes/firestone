import { MainWindowStoreEvent } from '../main-window-store-event';
import { DeckSortType } from '@firestone/shared/common/service';

export class ChangeDeckSortEvent implements MainWindowStoreEvent {
	
	readonly eventName = ChangeDeckSortEvent.eventName

	constructor(public readonly sort: DeckSortType) {}

	static readonly eventName = 'ChangeDeckSortEvent'
}
