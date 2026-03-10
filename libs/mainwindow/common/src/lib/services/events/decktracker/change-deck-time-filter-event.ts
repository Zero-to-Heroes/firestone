import { MainWindowStoreEvent } from '../main-window-store-event';
import { DeckTimeFilterType } from '@firestone/shared/common/service';

export class ChangeDeckTimeFilterEvent implements MainWindowStoreEvent {
	
	readonly eventName = ChangeDeckTimeFilterEvent.eventName

	static readonly eventName = 'ChangeDeckTimeFilterEvent'

	constructor(public readonly newFormat: DeckTimeFilterType) {}
}
