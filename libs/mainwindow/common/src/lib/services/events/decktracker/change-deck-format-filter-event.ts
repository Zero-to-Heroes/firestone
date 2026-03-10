import { MainWindowStoreEvent } from '../main-window-store-event';
import { StatGameFormatType } from '@firestone/stats/data-access';

export class ChangeDeckFormatFilterEvent implements MainWindowStoreEvent {
	
	readonly eventName = ChangeDeckFormatFilterEvent.eventName

	static readonly eventName = 'ChangeDeckFormatFilterEvent'

	constructor(public readonly newFormat: StatGameFormatType) {}
}
