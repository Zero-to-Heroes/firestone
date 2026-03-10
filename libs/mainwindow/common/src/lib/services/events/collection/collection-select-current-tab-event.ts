import { CurrentView } from '@firestone/collection/common';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class CollectionSelectCurrentTabEvent implements MainWindowStoreEvent {
	
	readonly eventName = CollectionSelectCurrentTabEvent.eventName

	constructor(public readonly tab: CurrentView) {}

	static readonly eventName = 'CollectionSelectCurrentTabEvent'
}
