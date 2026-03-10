import { MainWindowStoreEvent } from '../main-window-store-event';

export class ChangeDeckModeFilterEvent implements MainWindowStoreEvent {
	
	readonly eventName = ChangeDeckModeFilterEvent.eventName

	static readonly eventName = 'ChangeDeckModeFilterEvent'
}
